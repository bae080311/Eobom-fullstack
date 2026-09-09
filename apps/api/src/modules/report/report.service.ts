import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { OllamaService } from './ollama.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { UserRole, OrgMembershipStatus, NotificationType } from '@eobom/shared';
import type { GenerateReportDto, SessionReportResponseDto, IUser } from '@eobom/shared';

const PROMPT_VERSION = 'report-v1';

/** Prisma가 unique 제약 위반에 쓰는 에러 코드. */
const UNIQUE_VIOLATION_CODE = 'P2002';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaService,
    private readonly notifications: NotificationsService,
  ) {}

  async generate(
    scheduleId: string,
    user: IUser,
    dto: GenerateReportDto,
  ): Promise<SessionReportResponseDto> {
    this.logger.log(`generate: scheduleId=${scheduleId} userId=${user.id} role=${user.role}`);

    if (user.role !== UserRole.THERAPIST) {
      this.logger.warn(`generate: non-therapist role=${user.role} userId=${user.id}`);
      throw new ForbiddenException('치료사만 리포트를 생성할 수 있습니다.');
    }

    const schedule = await this.prisma.schedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다.');

    const profile = await this.prisma.therapistProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');

    // 다중 기관 소속 치료사를 고려해, 일정의 기관에 대한 활성 멤버십을 직접 검증한다.
    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        therapistProfileId: profile.id,
        organizationId: schedule.organizationId,
        status: OrgMembershipStatus.ACTIVE,
      },
    });
    if (!membership) {
      this.logger.warn(`generate: therapist=${profile.id} cannot access schedule=${scheduleId}`);
      throw new ForbiddenException('해당 일정의 기관에 소속되어 있지 않습니다.');
    }

    const report = await this.ollama.generateReport(dto.memo);

    const fields = {
      rawMemo: dto.memo,
      summary: report.summary,
      activities: report.activities,
      progress: report.progress,
      homework: report.homework,
      nextGoal: report.nextGoal,
      tone: report.tone,
      promptVersion: PROMPT_VERSION,
    };

    // 알림은 "처음 작성"에만 보낸다. 재생성은 덮어쓰기라 치료사가 문구를 다듬을
    // 때마다 학부모에게 알림이 쌓이면 소음이 된다.
    //
    // "처음인지"를 미리 조회해서 판단하면 동시 요청 둘이 모두 없음을 읽고 각자
    // 알림을 보낸다(폼 제출이 30초 걸려 이중 클릭이 실제로 가능하다).
    // scheduleId unique 제약으로 생성을 원자적으로 선점하고, 선점에 성공한
    // 요청만 알림을 보낸다.
    let saved: Awaited<ReturnType<typeof this.prisma.sessionReport.create>>;
    let isFirstReport: boolean;

    try {
      // 선점 성공(=최초 작성)과 알림을 한 트랜잭션으로 묶는다. 알림을 남길 수 없으면
      // 리포트 생성도 롤백돼 치료사가 재시도할 수 있다 — 리포트만 커밋되면 이후 호출은
      // 전부 update 경로(알림 없음)라 학부모는 리포트가 온 것을 영구히 모른다.
      //
      // Ollama 호출(최대 30초)은 위에서 이미 끝났다. 트랜잭션 안에 두면 안 된다.
      //
      // 아래 catch가 트랜잭션 전체의 P2002를 보게 되지만, `Notification`에는 unique
      // 제약이 없어 알림 insert가 P2002를 낼 경로가 없다.
      saved = await this.prisma.$transaction(async (tx) => {
        const created = await tx.sessionReport.create({ data: { scheduleId, ...fields } });

        await this.notifications.notifyScheduleEvent(tx, {
          scheduleId,
          childId: schedule.childId,
          organizationId: schedule.organizationId,
          type: NotificationType.SESSION_REPORT_CREATED,
          // 웹이 "6월 1일 (월) 14:00" 형태로 어느 수업의 리포트인지 보여준다.
          payload: { startAt: schedule.startAt.toISOString() },
        });

        return created;
      });
      isFirstReport = true;
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;

      // 다른 요청이 먼저 만들었거나 이미 있던 리포트다 — 갱신만 한다.
      saved = await this.prisma.sessionReport.update({ where: { scheduleId }, data: fields });
      isFirstReport = false;
    }

    this.logger.log(
      `generate: report saved id=${saved.id} schedule=${scheduleId} first=${isFirstReport}`,
    );

    // 생성은 치료사 전용이므로 원본 메모를 함께 돌려준다 (재생성 폼 프리필용).
    return this.toDto(saved, { includeRawMemo: true });
  }

  async findOne(scheduleId: string, user: IUser): Promise<SessionReportResponseDto | null> {
    this.logger.log(`findOne: scheduleId=${scheduleId} userId=${user.id} role=${user.role}`);

    const schedule = await this.prisma.schedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다.');

    if (user.role === UserRole.PARENT) {
      const parentProfile = await this.prisma.parentProfile.findUnique({
        where: { userId: user.id },
      });
      if (!parentProfile) throw new NotFoundException('학부모 프로필을 찾을 수 없습니다.');

      const link = await this.prisma.parentChildLink.findUnique({
        where: { parentId_childId: { parentId: parentProfile.id, childId: schedule.childId } },
      });
      if (!link) {
        this.logger.warn(
          `findOne: parent=${parentProfile.id} not linked to child=${schedule.childId}`,
        );
        throw new ForbiddenException();
      }
    } else {
      const profile = await this.prisma.therapistProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile) throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');

      const membership = await this.prisma.organizationMembership.findFirst({
        where: {
          therapistProfileId: profile.id,
          organizationId: schedule.organizationId,
          status: OrgMembershipStatus.ACTIVE,
        },
      });
      if (!membership) {
        this.logger.warn(`findOne: therapist=${profile.id} cannot access schedule=${scheduleId}`);
        throw new ForbiddenException();
      }
    }

    const report = await this.prisma.sessionReport.findUnique({ where: { scheduleId } });
    if (!report) return null;

    // 학부모에게는 원본 메모를 내리지 않는다 — 요약본을 공유하는 것이 이 기능의 목적이다.
    const includeRawMemo = user.role !== UserRole.PARENT;
    return this.toDto(report, { includeRawMemo });
  }

  /** Prisma의 unique 제약 위반(P2002)인지 판별한다. */
  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION_CODE
    );
  }

  private toDto(
    report: {
      id: string;
      scheduleId: string;
      rawMemo: string;
      summary: string;
      activities: string[];
      progress: string;
      homework: string | null;
      nextGoal: string;
      tone: string;
      promptVersion: string;
      createdAt: Date;
      updatedAt: Date;
    },
    { includeRawMemo }: { includeRawMemo: boolean },
  ): SessionReportResponseDto {
    return {
      id: report.id,
      scheduleId: report.scheduleId,
      // 필드를 아예 빼야 한다 — null/빈 문자열로 두면 값이 응답에 남는다.
      ...(includeRawMemo ? { rawMemo: report.rawMemo } : {}),
      summary: report.summary,
      activities: report.activities,
      progress: report.progress,
      homework: report.homework,
      nextGoal: report.nextGoal,
      tone: report.tone,
      promptVersion: report.promptVersion,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }
}
