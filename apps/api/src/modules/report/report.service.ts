import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { OllamaService } from './ollama.service.js';
import { UserRole, OrgMembershipStatus } from '@eobom/shared';
import type { GenerateReportDto, SessionReportResponseDto, IUser } from '@eobom/shared';

const PROMPT_VERSION = 'report-v1';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaService,
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

    const profile = await this.prisma.therapistProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');

    const membership = await this.prisma.organizationMembership.findFirst({
      where: { therapistProfileId: profile.id, status: OrgMembershipStatus.ACTIVE },
    });
    if (!membership) throw new NotFoundException('소속 기관을 찾을 수 없습니다.');

    const schedule = await this.prisma.schedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다.');
    if (schedule.organizationId !== membership.organizationId) {
      this.logger.warn(`generate: therapist=${profile.id} cannot access schedule=${scheduleId}`);
      throw new ForbiddenException();
    }

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
    return { data: this.toDto(saved) };
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
        where: { therapistProfileId: profile.id, status: OrgMembershipStatus.ACTIVE },
      });
      if (!membership || schedule.organizationId !== membership.organizationId) {
        this.logger.warn(`findOne: therapist=${profile.id} cannot access schedule=${scheduleId}`);
        throw new ForbiddenException();
      }
    }

    const report = await this.prisma.sessionReport.findUnique({ where: { scheduleId } });
    return { data: report ? this.toDto(report) : null };
  }

  private toDto(report: {
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
  }): SessionReportResponseDto {
    return {
      id: report.id,
      scheduleId: report.scheduleId,
      rawMemo: report.rawMemo,
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
