import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { OrgMemberRole, OrgMembershipStatus } from '@eobom/shared';
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  UpdateMembershipDto,
  OrganizationResponseDto,
  MemberResponseDto,
  RotateJoinCodeResponseDto,
} from '@eobom/shared';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    this.logger.log(`create: userId=${userId}`);

    const profile = await this.requireTherapistProfile(userId);

    const existing = await this.prisma.organizationMembership.findFirst({
      where: { therapistProfileId: profile.id, status: OrgMembershipStatus.ACTIVE },
    });
    if (existing) {
      this.logger.warn(`create: therapist=${profile.id} already has an active membership`);
      throw new ConflictException('이미 소속된 기관이 있습니다.');
    }

    const joinCode = await this.generateUniqueJoinCode();
    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        joinCode,
        createdById: profile.id,
        memberships: {
          create: { therapistProfileId: profile.id, role: OrgMemberRole.OWNER },
        },
      },
      include: { memberships: { where: { therapistProfileId: profile.id } } },
    });

    const membership = org.memberships[0];
    if (!membership) {
      this.logger.error(`create: membership not created for org=${org.id}`);
      throw new ConflictException('기관 멤버십 생성에 실패했습니다.');
    }

    this.logger.log(`create: org=${org.id} owner=${profile.id}`);
    return this.toOrganizationDto(org, membership);
  }

  async findMine(userId: string): Promise<OrganizationResponseDto> {
    this.logger.log(`findMine: userId=${userId}`);

    const profile = await this.requireTherapistProfile(userId);
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { therapistProfileId: profile.id, status: OrgMembershipStatus.ACTIVE },
      include: { organization: true },
    });
    if (!membership) {
      this.logger.warn(`findMine: no active membership for therapist=${profile.id}`);
      throw new NotFoundException('소속된 기관이 없습니다.');
    }

    return this.toOrganizationDto(membership.organization, membership);
  }

  async update(
    userId: string,
    orgId: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    this.logger.log(`update: userId=${userId} org=${orgId}`);

    const membership = await this.requireMembership(userId, orgId, { ownerOnly: true });

    if (dto.name === undefined) {
      throw new BadRequestException('수정할 기관 이름을 입력해주세요.');
    }

    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: { name: dto.name },
    });

    this.logger.log(`update: org=${org.id}`);
    return this.toOrganizationDto(org, membership);
  }

  async rotateJoinCode(userId: string, orgId: string): Promise<RotateJoinCodeResponseDto> {
    this.logger.log(`rotateJoinCode: userId=${userId} org=${orgId}`);

    await this.requireMembership(userId, orgId, { ownerOnly: true });

    const joinCode = await this.generateUniqueJoinCode();
    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: { joinCode, joinCodeRotatedAt: new Date() },
    });

    this.logger.log(`rotateJoinCode: org=${org.id} rotated`);
    return { joinCode: org.joinCode, rotatedAt: org.joinCodeRotatedAt.toISOString() };
  }

  async findMembers(userId: string, orgId: string): Promise<MemberResponseDto[]> {
    this.logger.log(`findMembers: userId=${userId} org=${orgId}`);

    await this.requireMembership(userId, orgId);

    const memberships = await this.prisma.organizationMembership.findMany({
      where: { organizationId: orgId, status: OrgMembershipStatus.ACTIVE },
      include: { therapistProfile: { include: { user: true } } },
      orderBy: { joinedAt: 'asc' },
    });

    this.logger.log(`findMembers: org=${orgId} count=${memberships.length}`);
    return memberships.map((m) => this.toMemberDto(m));
  }

  async updateMember(
    userId: string,
    orgId: string,
    membershipId: string,
    dto: UpdateMembershipDto,
  ): Promise<MemberResponseDto> {
    this.logger.log(`updateMember: userId=${userId} org=${orgId} membership=${membershipId}`);

    await this.requireMembership(userId, orgId, { ownerOnly: true });

    const target = await this.prisma.organizationMembership.findFirst({
      where: { id: membershipId, organizationId: orgId, status: OrgMembershipStatus.ACTIVE },
    });
    if (!target) throw new NotFoundException('멤버를 찾을 수 없습니다.');

    const isOwnerDemotion =
      target.role === OrgMemberRole.OWNER && dto.role && dto.role !== OrgMemberRole.OWNER;

    // 마지막 OWNER 강등 검증과 업데이트를 한 트랜잭션으로 묶어 동시성 경쟁을 차단
    const updated = await this.prisma.$transaction(
      async (tx) => {
        if (isOwnerDemotion) {
          await this.assertNotLastOwner(orgId, tx);
        }
        return tx.organizationMembership.update({
          where: { id: membershipId },
          data: { ...(dto.role !== undefined ? { role: dto.role } : {}) },
          include: { therapistProfile: { include: { user: true } } },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    this.logger.log(`updateMember: membership=${membershipId} role=${updated.role}`);
    return this.toMemberDto(updated);
  }

  async leaveMember(userId: string, orgId: string, membershipId: string): Promise<void> {
    this.logger.log(`leaveMember: userId=${userId} org=${orgId} membership=${membershipId}`);

    const caller = await this.requireMembership(userId, orgId);

    const target = await this.prisma.organizationMembership.findFirst({
      where: { id: membershipId, organizationId: orgId, status: OrgMembershipStatus.ACTIVE },
    });
    if (!target) throw new NotFoundException('멤버를 찾을 수 없습니다.');

    // 본인 탈퇴이거나, OWNER가 다른 멤버를 내보내는 경우만 허용
    const isSelf = target.id === caller.id;
    if (!isSelf && caller.role !== OrgMemberRole.OWNER) {
      this.logger.warn(`leaveMember: ${caller.id} cannot remove ${target.id}`);
      throw new ForbiddenException('다른 멤버를 내보낼 권한이 없습니다.');
    }

    // 마지막 OWNER 탈퇴 검증과 업데이트를 한 트랜잭션으로 묶어 동시성 경쟁을 차단
    const isOwnerLeaving = target.role === OrgMemberRole.OWNER;
    await this.prisma.$transaction(
      async (tx) => {
        if (isOwnerLeaving) {
          await this.assertNotLastOwner(orgId, tx);
        }
        await tx.organizationMembership.update({
          where: { id: membershipId },
          data: { status: OrgMembershipStatus.LEFT, leftAt: new Date() },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    this.logger.log(`leaveMember: membership=${membershipId} left`);
  }

  // ==================== helpers ====================

  private async requireTherapistProfile(userId: string) {
    const profile = await this.prisma.therapistProfile.findUnique({ where: { userId } });
    if (!profile) {
      this.logger.warn(`requireTherapistProfile: not found for userId=${userId}`);
      throw new ForbiddenException('치료사만 접근할 수 있습니다.');
    }
    return profile;
  }

  /**
   * 호출자가 해당 기관의 ACTIVE 멤버인지 검증하고 멤버십을 반환한다.
   * ownerOnly가 true면 OWNER 역할까지 요구한다.
   */
  private async requireMembership(
    userId: string,
    orgId: string,
    opts: { ownerOnly?: boolean } = {},
  ) {
    const profile = await this.requireTherapistProfile(userId);
    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        organizationId: orgId,
        therapistProfileId: profile.id,
        status: OrgMembershipStatus.ACTIVE,
      },
    });
    if (!membership) {
      this.logger.warn(`requireMembership: therapist=${profile.id} not in org=${orgId}`);
      throw new ForbiddenException('해당 기관의 멤버가 아닙니다.');
    }
    if (opts.ownerOnly && membership.role !== OrgMemberRole.OWNER) {
      this.logger.warn(`requireMembership: therapist=${profile.id} is not OWNER of org=${orgId}`);
      throw new ForbiddenException('기관 소유자만 수행할 수 있습니다.');
    }
    return membership;
  }

  private async assertNotLastOwner(
    orgId: string,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<void> {
    const ownerCount = await client.organizationMembership.count({
      where: {
        organizationId: orgId,
        role: OrgMemberRole.OWNER,
        status: OrgMembershipStatus.ACTIVE,
      },
    });
    if (ownerCount <= 1) {
      throw new BadRequestException('기관에는 최소 한 명의 소유자가 있어야 합니다.');
    }
  }

  private async generateUniqueJoinCode(): Promise<string> {
    // joinCode는 @unique. 충돌은 드물지만 안전하게 재시도한다.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      const existing = await this.prisma.organization.findUnique({ where: { joinCode: code } });
      if (!existing) return code;
    }
    throw new ConflictException('참여 코드 생성에 실패했습니다. 다시 시도해주세요.');
  }

  private toOrganizationDto(
    org: { id: string; name: string; joinCode: string },
    membership: { id: string; role: string },
  ): OrganizationResponseDto {
    return {
      id: org.id,
      name: org.name,
      joinCode: org.joinCode,
      membership: { id: membership.id, role: membership.role as OrgMemberRole },
    };
  }

  private toMemberDto(membership: {
    id: string;
    role: string;
    status: string;
    joinedAt: Date;
    therapistProfile: { user: { id: string; name: string; email: string } };
  }): MemberResponseDto {
    return {
      id: membership.id,
      role: membership.role as OrgMemberRole,
      status: membership.status as OrgMembershipStatus,
      joinedAt: membership.joinedAt.toISOString(),
      user: {
        id: membership.therapistProfile.user.id,
        name: membership.therapistProfile.user.name,
        email: membership.therapistProfile.user.email,
      },
    };
  }
}
