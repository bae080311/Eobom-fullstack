import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ScheduleStatus } from '@eobom/shared';
import type { CreateChildDto, UpdateChildDto, ChildResponseDto } from '@eobom/shared';

@Injectable()
export class ChildrenService {
  private readonly logger = new Logger(ChildrenService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<ChildResponseDto[]> {
    this.logger.log(`findAll: userId=${userId}`);

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
