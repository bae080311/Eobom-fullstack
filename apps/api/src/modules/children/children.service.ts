import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ScheduleStatus, UserRole } from '@eobom/shared';
import type { CreateChildDto, UpdateChildDto, ChildResponseDto, IUser } from '@eobom/shared';

@Injectable()
export class ChildrenService {
  private readonly logger = new Logger(ChildrenService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: IUser): Promise<ChildResponseDto[]> {
    this.logger.log(`findAll: userId=${user.id} role=${user.role}`);

    if (user.role === UserRole.PARENT) {
      return this.findAllForParent(user.id);
    }

    return this.findAllForTherapist(user.id);
  }

  private async findAllForParent(userId: string): Promise<ChildResponseDto[]> {
    const parentProfile = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!parentProfile) {
      this.logger.warn(`findAll: parentProfile not found for userId=${userId}`);
      throw new NotFoundException('학부모 프로필을 찾을 수 없습니다.');
    }

    const now = new Date();
    const children = await this.prisma.child.findMany({
      where: { parentLinks: { some: { parentId: parentProfile.id } } },
      include: {
        schedules: {
          where: {
            startAt: { gte: now },
            status: { in: [ScheduleStatus.SCHEDULED, ScheduleStatus.RESCHEDULED] },
          },
          orderBy: { startAt: 'asc' },
          take: 1,
          select: { startAt: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    this.logger.log(`findAll: found ${children.length} children for parent=${parentProfile.id}`);
    return children.map((c) => this.toDto(c));
  }

  private async findAllForTherapist(userId: string): Promise<ChildResponseDto[]> {
    const profile = await this.prisma.therapistProfile.findUnique({ where: { userId } });
    if (!profile) {
      this.logger.warn(`findAll: therapistProfile not found for userId=${userId}`);
      throw new NotFoundException('치료사 프로필을 찾을 수 없습니다.');
    }

    const now = new Date();
    const children = await this.prisma.child.findMany({
      where: {
        OR: [
          { primaryTherapistId: profile.id },
          { schedules: { some: { therapistId: profile.id } } },
        ],
      },
      include: {
        schedules: {
          where: {
            therapistId: profile.id,
            startAt: { gte: now },
            status: { in: [ScheduleStatus.SCHEDULED, ScheduleStatus.RESCHEDULED] },
          },
          orderBy: { startAt: 'asc' },
          take: 1,
          select: { startAt: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    this.logger.log(`findAll: found ${children.length} children for therapist=${profile.id}`);
    return children.map((c) => this.toDto(c));
  }

  async findOne(_id: string) {
    throw new Error('Not implemented - Phase 3');
  }

  async create(_dto: CreateChildDto) {
    throw new Error('Not implemented - Phase 3');
  }

  async update(_id: string, _dto: UpdateChildDto) {
    throw new Error('Not implemented - Phase 3');
  }

  async remove(_id: string) {
    throw new Error('Not implemented - Phase 3');
  }

  private toDto(child: {
    id: string;
    name: string;
    birthDate: Date | null;
    memo: string | null;
    schedules: { startAt: Date }[];
  }): ChildResponseDto {
    return {
      id: child.id,
      name: child.name,
      birthDate: child.birthDate ? child.birthDate.toISOString() : null,
      memo: child.memo,
      nextSessionAt: child.schedules[0] ? child.schedules[0].startAt.toISOString() : null,
    };
  }
}
