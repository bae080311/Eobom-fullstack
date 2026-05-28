import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ScheduleStatus, OrgMembershipStatus } from '@eobom/shared';
import type {
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleQueryDto,
  ScheduleResponseDto,
} from '@eobom/shared';

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ScheduleQueryDto, userId: string): Promise<ScheduleResponseDto[]> {
    this.logger.log(`findAll: userId=${userId}`);

    const profile = await this.prisma.therapistProfile.findUnique({ where: { userId } });
    if (!profile) {
      this.logger.warn(`findAll: therapistProfile not found for userId=${userId}`);
      throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');
    }

    const schedules = await this.prisma.schedule.findMany({
      where: {
        therapistId: profile.id,
        ...(query.from || query.to
          ? {
              startAt: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      include: { child: { select: { id: true, name: true } } },
      orderBy: { startAt: 'asc' },
    });

    this.logger.log(`findAll: found ${schedules.length} schedules for therapist=${profile.id}`);
    return schedules.map((s) => this.toDto(s));
  }

  async findOne(id: string, userId: string): Promise<ScheduleResponseDto> {
    this.logger.log(`findOne: id=${id} userId=${userId}`);

    const profile = await this.prisma.therapistProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');

    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: { child: { select: { id: true, name: true } } },
    });
    if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다.');
    if (schedule.therapistId !== profile.id) throw new ForbiddenException();

    return this.toDto(schedule);
  }

  async create(dto: CreateScheduleDto, userId: string): Promise<ScheduleResponseDto> {
    this.logger.log(`create: userId=${userId}`);

    const profile = await this.prisma.therapistProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');

    const membership = await this.prisma.organizationMembership.findFirst({
      where: { therapistProfileId: profile.id, status: OrgMembershipStatus.ACTIVE },
    });
    if (!membership) throw new NotFoundException('소속 기관을 찾을 수 없습니다.');

    const schedule = await this.prisma.schedule.create({
      data: {
        childId: dto.childId,
        therapistId: dto.therapistId ?? profile.id,
        organizationId: membership.organizationId,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        title: dto.title,
        notes: dto.notes,
      },
      include: { child: { select: { id: true, name: true } } },
    });

    this.logger.log(`create: schedule=${schedule.id}`);
    return this.toDto(schedule);
  }

  async update(id: string, dto: UpdateScheduleDto, userId: string): Promise<ScheduleResponseDto> {
    this.logger.log(`update: id=${id} userId=${userId}`);

    const profile = await this.prisma.therapistProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');

    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다.');
    if (schedule.therapistId !== profile.id) throw new ForbiddenException();

    const timeChanged = !!(dto.startAt || dto.endAt);

    const updated = await this.prisma.schedule.update({
      where: { id },
      data: {
        ...(dto.startAt ? { startAt: new Date(dto.startAt) } : {}),
        ...(dto.endAt ? { endAt: new Date(dto.endAt) } : {}),
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(timeChanged ? { status: ScheduleStatus.RESCHEDULED } : {}),
      },
      include: { child: { select: { id: true, name: true } } },
    });

    this.logger.log(`update: schedule=${id} timeChanged=${timeChanged}`);
    return this.toDto(updated);
  }

  async cancel(id: string, userId: string): Promise<ScheduleResponseDto> {
    this.logger.log(`cancel: id=${id} userId=${userId}`);

    const profile = await this.prisma.therapistProfile.findUnique({ where: { userId } });
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
}
