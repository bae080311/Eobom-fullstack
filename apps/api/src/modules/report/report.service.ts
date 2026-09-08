import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { OllamaService } from './ollama.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { UserRole, OrgMembershipStatus, NotificationType } from '@eobom/shared';
import type { GenerateReportDto, SessionReportResponseDto, IUser } from '@eobom/shared';

const PROMPT_VERSION = 'report-v1';

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
  ): Promise<{ data: SessionReportResponseDto }> {
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

    // 알림은 "처음 작성"에만 보낸다. 재생성은 upsert로 덮어쓰는 것이라
    // 치료사가 문구를 다듬을 때마다 학부모에게 알림이 쌓이면 소음이 된다.
    // Ollama 호출(최대 30초) 전에 확인해 둔다 — 그 사이에 다른 요청이 끼어들 수는
    // 있지만, 알림이 한 번 더 가는 정도라 트랜잭션으로 묶을 만한 사안은 아니다.
    const existing = await this.prisma.sessionReport.findUnique({
      where: { scheduleId },
      select: { id: true },
    });

    const report = await this.ollama.generateReport(dto.memo);

    const saved = await this.prisma.sessionReport.upsert({
      where: { scheduleId },
      create: {
        scheduleId,
        rawMemo: dto.memo,
        summary: report.summary,
        activities: report.activities,
        progress: report.progress,
        homework: report.homework,
        nextGoal: report.nextGoal,
        tone: report.tone,
        promptVersion: PROMPT_VERSION,
      },
      update: {
        rawMemo: dto.memo,
        summary: report.summary,
        activities: report.activities,
        progress: report.progress,
        homework: report.homework,
        nextGoal: report.nextGoal,
        tone: report.tone,
        promptVersion: PROMPT_VERSION,
      },
    });

    this.logger.log(`generate: report saved id=${saved.id} schedule=${scheduleId}`);

    if (!existing) {
      // 알림은 리포트에 딸린 부수 효과다. 실패해도 리포트 생성은 성공으로 둔다
      // (notifyScheduleEvent가 내부에서 예외를 삼키고 로그만 남긴다).
      await this.notifications.notifyScheduleEvent({
        scheduleId,
        childId: schedule.childId,
        organizationId: schedule.organizationId,
        type: NotificationType.SESSION_REPORT_CREATED,
        // 웹이 "6월 1일 (월) 14:00" 형태로 어느 수업의 리포트인지 보여준다.
        payload: { startAt: schedule.startAt.toISOString() },
      });
    }

    // 생성은 치료사 전용이므로 원본 메모를 함께 돌려준다 (재생성 폼 프리필용).
    return { data: this.toDto(saved, { includeRawMemo: true }) };
  }

  async findOne(
    scheduleId: string,
    user: IUser,
  ): Promise<{ data: SessionReportResponseDto | null }> {
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
    if (!report) return { data: null };

    // 학부모에게는 원본 메모를 내리지 않는다 — 요약본을 공유하는 것이 이 기능의 목적이다.
    const includeRawMemo = user.role !== UserRole.PARENT;
    return { data: this.toDto(report, { includeRawMemo }) };
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
