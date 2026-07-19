import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ScheduleStatus, OrgMembershipStatus, UserRole, NotificationType } from '@eobom/shared';
import type {
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleQueryDto,
  ScheduleResponseDto,
  ScheduleDetailResponseDto,
  CreateRecurringScheduleDto,
  CreateRecurringScheduleResponseDto,
  RecurringRuleResponseDto,
  IUser,
} from '@eobom/shared';

// endDate 없이 무기한 반복을 요청하면 생성량이 발산하므로 상한 윈도우를 둔다.
const RECURRING_MAX_WINDOW_DAYS = 90;
const RECURRING_MAX_WINDOW_SPAN_DAYS = 365;
const RECURRING_MAX_OCCURRENCES = 200;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: ScheduleQueryDto, user: IUser): Promise<ScheduleResponseDto[]> {
    this.logger.log(`findAll: userId=${user.id} role=${user.role}`);

    if (user.role === UserRole.PARENT) {
      return this.findAllForParent(query, user.id);
    }

    return this.findAllForTherapist(query, user.id);
  }

  private buildDateAndStatusWhere(query: ScheduleQueryDto) {
    return {
      ...(query.from || query.to
        ? {
            startAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
    };
  }

  private async findAllForParent(
    query: ScheduleQueryDto,
    userId: string,
  ): Promise<ScheduleResponseDto[]> {
    const parentProfile = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!parentProfile) {
      this.logger.warn(`findAll: parentProfile not found for userId=${userId}`);
      throw new NotFoundException('학부모 프로필을 찾을 수 없습니다.');
    }

    const links = await this.prisma.parentChildLink.findMany({
      where: { parentId: parentProfile.id },
      select: { childId: true },
    });
    const childIds = links.map((l) => l.childId);
    if (childIds.length === 0) {
      return [];
    }

    const schedules = await this.prisma.schedule.findMany({
      where: {
        childId: { in: childIds },
        ...this.buildDateAndStatusWhere(query),
      },
      include: {
        child: { select: { id: true, name: true } },
        therapist: { select: { user: { select: { name: true } } } },
      },
      orderBy: { startAt: 'asc' },
    });

    this.logger.log(`findAll: found ${schedules.length} schedules for parent=${parentProfile.id}`);
    return schedules.map((s) => ({ ...this.toDto(s), therapistName: s.therapist?.user?.name }));
  }

  private async findAllForTherapist(
    query: ScheduleQueryDto,
    userId: string,
  ): Promise<ScheduleResponseDto[]> {
    const profile = await this.prisma.therapistProfile.findUnique({ where: { userId } });
    if (!profile) {
      this.logger.warn(`findAll: therapistProfile not found for userId=${userId}`);
      throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');
    }

    const schedules = await this.prisma.schedule.findMany({
      where: {
        therapistId: profile.id,
        ...this.buildDateAndStatusWhere(query),
      },
      include: { child: { select: { id: true, name: true } } },
      orderBy: { startAt: 'asc' },
    });

    this.logger.log(`findAll: found ${schedules.length} schedules for therapist=${profile.id}`);
    return schedules.map((s) => this.toDto(s));
  }

  async findOne(id: string, user: IUser): Promise<ScheduleDetailResponseDto> {
    this.logger.log(`findOne: id=${id} userId=${user.id} role=${user.role}`);

    if (user.role === UserRole.PARENT) {
      const parentProfile = await this.prisma.parentProfile.findUnique({
        where: { userId: user.id },
      });
      if (!parentProfile) {
        this.logger.warn(`findOne: parentProfile not found for userId=${user.id}`);
        throw new NotFoundException('학부모 프로필을 찾을 수 없습니다.');
      }

      const schedule = await this.prisma.schedule.findUnique({
        where: { id },
        include: {
          child: { select: { id: true, name: true } },
          therapist: { select: { user: { select: { name: true } } } },
          acknowledgements: {
            where: { parentId: parentProfile.id },
            select: { acknowledgedAt: true },
          },
        },
      });
      if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다.');

      const link = await this.prisma.parentChildLink.findUnique({
        where: { parentId_childId: { parentId: parentProfile.id, childId: schedule.childId } },
      });
      if (!link) {
        this.logger.warn(
          `findOne: parent=${parentProfile.id} not linked to child=${schedule.childId}`,
        );
        throw new ForbiddenException();
      }

      return this.toDetailDto(schedule, schedule.acknowledgements[0] ?? null);
    }

    const profile = await this.prisma.therapistProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');

    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        child: { select: { id: true, name: true } },
        therapist: { select: { user: { select: { name: true } } } },
        acknowledgements: {
          orderBy: { acknowledgedAt: 'asc' },
          take: 1,
          select: { acknowledgedAt: true },
        },
      },
    });
    if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다.');
    if (schedule.therapistId !== profile.id) throw new ForbiddenException();

    return this.toDetailDto(schedule, schedule.acknowledgements[0] ?? null);
  }

  async acknowledge(id: string, user: IUser): Promise<ScheduleDetailResponseDto> {
    this.logger.log(`acknowledge: id=${id} userId=${user.id} role=${user.role}`);

    if (user.role !== UserRole.PARENT) {
      this.logger.warn(`acknowledge: non-parent role=${user.role} userId=${user.id}`);
      throw new ForbiddenException('학부모만 일정을 확인할 수 있습니다.');
    }

    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId: user.id },
    });
    if (!parentProfile) throw new NotFoundException('학부모 프로필을 찾을 수 없습니다.');

    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다.');

    const link = await this.prisma.parentChildLink.findUnique({
      where: { parentId_childId: { parentId: parentProfile.id, childId: schedule.childId } },
    });
    if (!link) {
      this.logger.warn(
        `acknowledge: parent=${parentProfile.id} not linked to child=${schedule.childId}`,
      );
      throw new ForbiddenException();
    }

    await this.prisma.scheduleAcknowledgement.upsert({
      where: { scheduleId_parentId: { scheduleId: id, parentId: parentProfile.id } },
      create: { scheduleId: id, parentId: parentProfile.id },
      update: {},
    });

    this.logger.log(`acknowledge: schedule=${id} parent=${parentProfile.id}`);

    // findOne을 재호출하면 parentProfile·parentChildLink를 중복 조회하므로,
    // 검증을 마친 이 시점에서 detail 형태로 직접 재조회한다.
    const updatedSchedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        child: { select: { id: true, name: true } },
        therapist: { select: { user: { select: { name: true } } } },
        acknowledgements: {
          where: { parentId: parentProfile.id },
          select: { acknowledgedAt: true },
        },
      },
    });
    if (!updatedSchedule) throw new NotFoundException('일정을 찾을 수 없습니다.');

    return this.toDetailDto(updatedSchedule, updatedSchedule.acknowledgements[0] ?? null);
  }

  async create(dto: CreateScheduleDto, userId: string): Promise<ScheduleResponseDto> {
    this.logger.log(`create: userId=${userId}`);

    const profile = await this.prisma.therapistProfile.findUnique({
      where: { userId },
      include: { user: { select: { name: true } } },
    });
    if (!profile) throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');

    const membership = await this.prisma.organizationMembership.findFirst({
      where: { therapistProfileId: profile.id, status: OrgMembershipStatus.ACTIVE },
    });
    if (!membership) throw new NotFoundException('소속 기관을 찾을 수 없습니다.');

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (startAt >= endAt) {
      throw new BadRequestException('시작 시간은 종료 시간보다 빨라야 합니다.');
    }

    const schedule = await this.prisma.schedule.create({
      data: {
        childId: dto.childId,
        therapistId: dto.therapistId ?? profile.id,
        organizationId: membership.organizationId,
        startAt,
        endAt,
        title: dto.title,
        notes: dto.notes,
      },
      include: { child: { select: { id: true, name: true } } },
    });

    this.logger.log(`create: schedule=${schedule.id}`);

    await this.notificationsService.notifyScheduleEvent({
      scheduleId: schedule.id,
      childId: schedule.childId,
      organizationId: membership.organizationId,
      type: NotificationType.SCHEDULE_CREATED,
      message: `${profile.user.name} 치료사님이 새 일정을 등록했습니다`,
    });

    return this.toDto(schedule);
  }

  async createRecurring(
    dto: CreateRecurringScheduleDto,
    userId: string,
  ): Promise<CreateRecurringScheduleResponseDto> {
    this.logger.log(`createRecurring: userId=${userId}`);

    const profile = await this.prisma.therapistProfile.findUnique({
      where: { userId },
      include: { user: { select: { name: true } } },
    });
    if (!profile) throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');

    const membership = await this.prisma.organizationMembership.findFirst({
      where: { therapistProfileId: profile.id, status: OrgMembershipStatus.ACTIVE },
    });
    if (!membership) throw new NotFoundException('소속 기관을 찾을 수 없습니다.');

    const windowEndDate = dto.endDate ?? this.addDays(dto.startDate, RECURRING_MAX_WINDOW_DAYS);

    const startMs = Date.parse(`${dto.startDate}T00:00:00Z`);
    const endMs = Date.parse(`${windowEndDate}T00:00:00Z`);
    if ((endMs - startMs) / ONE_DAY_MS > RECURRING_MAX_WINDOW_SPAN_DAYS) {
      throw new BadRequestException(
        `반복 일정은 최대 ${RECURRING_MAX_WINDOW_SPAN_DAYS}일 기간 내에서만 설정할 수 있습니다.`,
      );
    }

    const occurrenceDates = this.buildOccurrenceDates(dto.startDate, windowEndDate, dto.daysOfWeek);
    if (occurrenceDates.length === 0) {
      throw new BadRequestException('선택한 요일에 해당하는 날짜가 없습니다.');
    }
    if (occurrenceDates.length > RECURRING_MAX_OCCURRENCES) {
      throw new BadRequestException(
        `반복 일정은 최대 ${RECURRING_MAX_OCCURRENCES}건까지 생성할 수 있습니다. 기간을 줄여주세요.`,
      );
    }

    const therapistId = dto.therapistId ?? profile.id;

    const { rule, schedules } = await this.prisma.$transaction(async (tx) => {
      const rule = await tx.recurringRule.create({
        data: {
          organizationId: membership.organizationId,
          childId: dto.childId,
          therapistId,
          daysOfWeek: dto.daysOfWeek,
          startTime: dto.startTime,
          endTime: dto.endTime,
          timezone: dto.timezone,
          startDate: new Date(`${dto.startDate}T00:00:00Z`),
          endDate: dto.endDate ? new Date(`${dto.endDate}T00:00:00Z`) : null,
        },
      });

      await tx.schedule.createMany({
        data: occurrenceDates.map((date) => ({
          organizationId: membership.organizationId,
          childId: dto.childId,
          therapistId,
          startAt: new Date(`${date}T${dto.startTime}:00+09:00`),
          endAt: new Date(`${date}T${dto.endTime}:00+09:00`),
          title: dto.title,
          recurringRuleId: rule.id,
        })),
      });

      const schedules = await tx.schedule.findMany({
        where: { recurringRuleId: rule.id },
        include: { child: { select: { id: true, name: true } } },
        orderBy: { startAt: 'asc' },
      });

      return { rule, schedules };
    });

    this.logger.log(`createRecurring: rule=${rule.id} schedulesCreated=${schedules.length}`);

    if (schedules.length > 0) {
      await this.notificationsService.notifyScheduleEvent({
        scheduleId: schedules[0].id,
        childId: dto.childId,
        organizationId: membership.organizationId,
        type: NotificationType.SCHEDULE_CREATED,
        message: `${profile.user.name} 치료사님이 반복 일정 ${schedules.length}건을 등록했습니다`,
      });
    }

    return {
      recurringRule: this.toRecurringRuleDto(rule),
      schedules: schedules.map((s) => this.toDto(s)),
    };
  }

  private addDays(dateStr: string, days: number): string {
    const ms = Date.parse(`${dateStr}T00:00:00Z`) + days * ONE_DAY_MS;
    return new Date(ms).toISOString().slice(0, 10);
  }

  private buildOccurrenceDates(startDate: string, endDate: string, daysOfWeek: number[]): string[] {
    const days = new Set(daysOfWeek);
    const dates: string[] = [];
    const startMs = Date.parse(`${startDate}T00:00:00Z`);
    const endMs = Date.parse(`${endDate}T00:00:00Z`);

    for (let ms = startMs; ms <= endMs; ms += ONE_DAY_MS) {
      const current = new Date(ms);
      if (days.has(current.getUTCDay())) {
        dates.push(current.toISOString().slice(0, 10));
      }
    }

    return dates;
  }

  private toRecurringRuleDto(rule: {
    id: string;
    childId: string;
    therapistId: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    timezone: string;
    startDate: Date;
    endDate: Date | null;
    active: boolean;
  }): RecurringRuleResponseDto {
    return {
      id: rule.id,
      childId: rule.childId,
      therapistId: rule.therapistId,
      daysOfWeek: rule.daysOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
      timezone: rule.timezone,
      startDate: rule.startDate.toISOString().slice(0, 10),
      endDate: rule.endDate ? rule.endDate.toISOString().slice(0, 10) : null,
      active: rule.active,
    };
  }

  async update(id: string, dto: UpdateScheduleDto, userId: string): Promise<ScheduleResponseDto> {
    this.logger.log(`update: id=${id} userId=${userId}`);

    const profile = await this.prisma.therapistProfile.findUnique({
      where: { userId },
      include: { user: { select: { name: true } } },
    });
    if (!profile) throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');

    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다.');
    if (schedule.therapistId !== profile.id) throw new ForbiddenException();

    const startAt = dto.startAt ? new Date(dto.startAt) : schedule.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : schedule.endAt;
    if (startAt >= endAt) {
      throw new BadRequestException('시작 시간은 종료 시간보다 빨라야 합니다.');
    }

    const timeChanged = !!(dto.startAt || dto.endAt);

    const updated = await this.prisma.schedule.update({
      where: { id },
      data: {
        ...(dto.startAt ? { startAt } : {}),
        ...(dto.endAt ? { endAt } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(timeChanged ? { status: ScheduleStatus.RESCHEDULED } : {}),
      },
      include: { child: { select: { id: true, name: true } } },
    });

    this.logger.log(`update: schedule=${id} timeChanged=${timeChanged}`);

    await this.notificationsService.notifyScheduleEvent({
      scheduleId: updated.id,
      childId: updated.childId,
      organizationId: schedule.organizationId,
      type: NotificationType.SCHEDULE_UPDATED,
      message: `${profile.user.name} 치료사님이 일정을 변경했습니다`,
    });

    return this.toDto(updated);
  }

  async cancel(id: string, userId: string): Promise<ScheduleResponseDto> {
    this.logger.log(`cancel: id=${id} userId=${userId}`);

    const profile = await this.prisma.therapistProfile.findUnique({
      where: { userId },
      include: { user: { select: { name: true } } },
    });
    if (!profile) throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');

    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다.');
    if (schedule.therapistId !== profile.id) throw new ForbiddenException();

    const updated = await this.prisma.schedule.update({
      where: { id },
      data: { status: ScheduleStatus.CANCELED },
      include: { child: { select: { id: true, name: true } } },
    });

    this.logger.log(`cancel: schedule=${id}`);

    await this.notificationsService.notifyScheduleEvent({
      scheduleId: updated.id,
      childId: updated.childId,
      organizationId: schedule.organizationId,
      type: NotificationType.SCHEDULE_CANCELED,
      message: `${profile.user.name} 치료사님이 일정을 취소했습니다`,
    });

    return this.toDto(updated);
  }

  async confirm(id: string, userId: string): Promise<ScheduleResponseDto> {
    this.logger.log(`confirm: id=${id} userId=${userId}`);

    const profile = await this.prisma.therapistProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');

    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다.');
    if (schedule.therapistId !== profile.id) throw new ForbiddenException();

    const updated = await this.prisma.schedule.update({
      where: { id },
      data: { status: ScheduleStatus.COMPLETED },
      include: { child: { select: { id: true, name: true } } },
    });

    this.logger.log(`confirm: schedule=${id}`);
    return this.toDto(updated);
  }

  private toDto(schedule: {
    id: string;
    childId: string;
    child: { name: string };
    therapistId: string;
    startAt: Date;
    endAt: Date;
    status: string;
    title: string;
    notes: string | null;
  }): ScheduleResponseDto {
    return {
      id: schedule.id,
      childId: schedule.childId,
      childName: schedule.child.name,
      therapistId: schedule.therapistId,
      startAt: schedule.startAt.toISOString(),
      endAt: schedule.endAt.toISOString(),
      status: schedule.status as ScheduleStatus,
      title: schedule.title,
      notes: schedule.notes,
    };
  }

  private toDetailDto(
    schedule: {
      id: string;
      childId: string;
      child: { name: string };
      therapistId: string;
      startAt: Date;
      endAt: Date;
      status: string;
      title: string;
      notes: string | null;
      therapist: { user: { name: string } };
    },
    ack: { acknowledgedAt: Date } | null,
  ): ScheduleDetailResponseDto {
    return {
      ...this.toDto(schedule),
      therapistName: schedule.therapist.user.name,
      acknowledged: ack !== null,
      acknowledgedAt: ack ? ack.acknowledgedAt.toISOString() : null,
    };
  }
}
