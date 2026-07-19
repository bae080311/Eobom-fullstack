import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ScheduleStatus, UserRole, OrgMembershipStatus, OrgMemberRole } from '@eobom/shared';
import type {
  CreateChildDto,
  UpdateChildDto,
  ChildResponseDto,
  SetPrimaryTherapistDto,
  IUser,
} from '@eobom/shared';

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

  async findOne(id: string, user: IUser): Promise<ChildResponseDto> {
    this.logger.log(`findOne: id=${id} userId=${user.id} role=${user.role}`);

    if (user.role === UserRole.PARENT) {
      const parentProfile = await this.prisma.parentProfile.findUnique({
        where: { userId: user.id },
      });
      if (!parentProfile) {
        this.logger.warn(`findOne: parentProfile not found for userId=${user.id}`);
        throw new NotFoundException('학부모 프로필을 찾을 수 없습니다.');
      }

      const link = await this.prisma.parentChildLink.findUnique({
        where: { parentId_childId: { parentId: parentProfile.id, childId: id } },
      });
      if (!link) {
        this.logger.warn(`findOne: parent=${parentProfile.id} not linked to child=${id}`);
        throw new NotFoundException('아동을 찾을 수 없습니다.');
      }

      return this.getDetailDto(id);
    }

    const { organizationId } = await this.requireActiveMembership(user.id);
    await this.requireChildInOrg(id, organizationId);
    return this.getDetailDto(id);
  }

  async create(dto: CreateChildDto, userId: string): Promise<ChildResponseDto> {
    this.logger.log(`create: userId=${userId}`);

    const { profile, organizationId } = await this.requireActiveMembership(userId);

    const primaryTherapistId = dto.primaryTherapistId ?? profile.id;
    if (primaryTherapistId !== profile.id) {
      await this.assertTherapistInOrg(primaryTherapistId, organizationId);
    }

    const child = await this.prisma.child.create({
      data: {
        name: dto.name,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        memo: dto.memo,
        organizationId,
        primaryTherapistId,
      },
    });

    this.logger.log(`create: child=${child.id} org=${organizationId}`);
    return this.getDetailDto(child.id);
  }

  async update(id: string, dto: UpdateChildDto, userId: string): Promise<ChildResponseDto> {
    this.logger.log(`update: id=${id} userId=${userId}`);

    const { organizationId } = await this.requireActiveMembership(userId);
    await this.requireChildInOrg(id, organizationId);

    await this.prisma.child.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.birthDate !== undefined
          ? { birthDate: dto.birthDate ? new Date(dto.birthDate) : null }
          : {}),
        ...(dto.memo !== undefined ? { memo: dto.memo } : {}),
      },
    });

    this.logger.log(`update: child=${id}`);
    return this.getDetailDto(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    this.logger.log(`remove: id=${id} userId=${userId}`);

    const { profile, organizationId, role } = await this.requireActiveMembership(userId);
    const child = await this.requireChildInOrg(id, organizationId);

    const isOwner = role === OrgMemberRole.OWNER;
    const isPrimaryTherapist = child.primaryTherapistId === profile.id;
    if (!isOwner && !isPrimaryTherapist) {
      this.logger.warn(`remove: therapist=${profile.id} not permitted to remove child=${id}`);
      throw new ForbiddenException('담당 치료사 또는 기관 소유자만 삭제할 수 있습니다.');
    }

    await this.prisma.child.delete({ where: { id } });
    this.logger.log(`remove: child=${id} removed`);
  }

  async setPrimaryTherapist(
    id: string,
    dto: SetPrimaryTherapistDto,
    userId: string,
  ): Promise<ChildResponseDto> {
    this.logger.log(`setPrimaryTherapist: id=${id} userId=${userId}`);

    const { profile, organizationId, role } = await this.requireActiveMembership(userId);
    const child = await this.requireChildInOrg(id, organizationId);

    const isOwner = role === OrgMemberRole.OWNER;
    const isCurrentPrimary = child.primaryTherapistId === profile.id;
    if (!isOwner && !isCurrentPrimary) {
      this.logger.warn(
        `setPrimaryTherapist: therapist=${profile.id} not permitted for child=${id}`,
      );
      throw new ForbiddenException('담당 치료사 또는 기관 소유자만 변경할 수 있습니다.');
    }

    await this.assertTherapistInOrg(dto.primaryTherapistId, organizationId);

    await this.prisma.child.update({
      where: { id },
      data: { primaryTherapistId: dto.primaryTherapistId },
    });

    this.logger.log(`setPrimaryTherapist: child=${id} primaryTherapist=${dto.primaryTherapistId}`);
    return this.getDetailDto(id);
  }

  // ==================== helpers ====================

  private async requireActiveMembership(userId: string) {
    const profile = await this.prisma.therapistProfile.findUnique({ where: { userId } });
    if (!profile) {
      this.logger.warn(`requireActiveMembership: therapistProfile not found for userId=${userId}`);
      throw new ForbiddenException('치료사만 접근할 수 있습니다.');
    }
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { therapistProfileId: profile.id, status: OrgMembershipStatus.ACTIVE },
    });
    if (!membership) {
      this.logger.warn(`requireActiveMembership: no active membership for therapist=${profile.id}`);
      throw new NotFoundException('소속 기관을 찾을 수 없습니다.');
    }
    return { profile, organizationId: membership.organizationId, role: membership.role };
  }

  private async requireChildInOrg(id: string, organizationId: string) {
    const child = await this.prisma.child.findUnique({ where: { id } });
    if (!child || child.organizationId !== organizationId) {
      this.logger.warn(`requireChildInOrg: child=${id} not in org=${organizationId}`);
      throw new NotFoundException('아동을 찾을 수 없습니다.');
    }
    return child;
  }

  private async assertTherapistInOrg(
    therapistProfileId: string,
    organizationId: string,
  ): Promise<void> {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        therapistProfileId,
        organizationId,
        status: OrgMembershipStatus.ACTIVE,
      },
    });
    if (!membership) {
      throw new BadRequestException('같은 기관 소속 치료사만 담당자로 지정할 수 있습니다.');
    }
  }

  private async getDetailDto(id: string): Promise<ChildResponseDto> {
    const now = new Date();
    const child = await this.prisma.child.findUniqueOrThrow({
      where: { id },
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
    });
    return this.toDto(child);
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
