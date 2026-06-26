import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  InviteCodeType,
  InviteCodeStatus,
  OrgMemberRole,
  OrgMembershipStatus,
} from '@eobom/shared';
import type {
  IssueParentLinkCodeDto,
  RedeemInviteCodeDto,
  InviteCodeResponseDto,
  RedeemInviteCodeResponseDto,
} from '@eobom/shared';
import { PrismaService } from '../../database/prisma.service.js';

const DEFAULT_TTL_MINUTES = 60;

@Injectable()
export class InviteCodesService {
  private readonly logger = new Logger(InviteCodesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async issueParentLink(
    userId: string,
    dto: IssueParentLinkCodeDto,
  ): Promise<InviteCodeResponseDto> {
    this.logger.log(`issueParentLink: userId=${userId} child=${dto.childId}`);

    const { profile, organizationId } = await this.requireActiveMembership(userId);

    // 코드 발급 대상 아동이 발급자의 기관 소속인지 검증
    const child = await this.prisma.child.findUnique({ where: { id: dto.childId } });
    if (!child || child.organizationId !== organizationId) {
      this.logger.warn(`issueParentLink: child=${dto.childId} not in org=${organizationId}`);
      throw new NotFoundException('아동을 찾을 수 없습니다.');
    }

    const code = await this.generateUniqueCode();
    const ttlMinutes = dto.ttlMinutes ?? DEFAULT_TTL_MINUTES;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const created = await this.prisma.inviteCode.create({
      data: {
        code,
        type: InviteCodeType.PARENT_LINK,
        organizationId,
        childId: dto.childId,
        issuedById: profile.id,
        expiresAt,
      },
      include: {
        child: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`issueParentLink: code created id=${created.id} child=${dto.childId}`);
    return this.toDto(created);
  }

  async findAll(userId: string, childId?: string): Promise<InviteCodeResponseDto[]> {
    this.logger.log(`findAll: userId=${userId} childId=${childId ?? '-'}`);

    const { profile } = await this.requireActiveMembership(userId);

    const codes = await this.prisma.inviteCode.findMany({
      where: { issuedById: profile.id, ...(childId ? { childId } : {}) },
      include: {
        child: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`findAll: found ${codes.length} codes for therapist=${profile.id}`);
    return codes.map((c) => this.toDto(c));
  }

  async revoke(userId: string, id: string): Promise<void> {
    this.logger.log(`revoke: userId=${userId} code=${id}`);

    const { profile, organizationId, role } = await this.requireActiveMembership(userId);

    const code = await this.prisma.inviteCode.findUnique({ where: { id } });
    if (!code) throw new NotFoundException('초대 코드를 찾을 수 없습니다.');

    // 발급자 본인이거나, 같은 기관의 OWNER만 취소 가능
    const isIssuer = code.issuedById === profile.id;
    const isOwnerOfOrg = role === OrgMemberRole.OWNER && code.organizationId === organizationId;
    if (!isIssuer && !isOwnerOfOrg) {
      this.logger.warn(`revoke: therapist=${profile.id} cannot revoke code=${id}`);
      throw new ForbiddenException('코드를 취소할 권한이 없습니다.');
    }

    if (code.status !== InviteCodeStatus.ACTIVE) {
      throw new ConflictException('이미 사용되었거나 취소된 코드입니다.');
    }

    await this.prisma.inviteCode.update({
      where: { id },
      data: { status: InviteCodeStatus.REVOKED },
    });

    this.logger.log(`revoke: code=${id} revoked`);
  }

  async redeem(userId: string, dto: RedeemInviteCodeDto): Promise<RedeemInviteCodeResponseDto> {
    this.logger.log(`redeem: userId=${userId}`);

    const parentProfile = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!parentProfile) {
      this.logger.warn(`redeem: parentProfile not found for userId=${userId}`);
      throw new ForbiddenException('학부모만 코드를 사용할 수 있습니다.');
    }

    const code = await this.prisma.inviteCode.findUnique({
      where: { code: dto.code },
      include: {
        child: {
          include: {
            primaryTherapist: { include: { user: { select: { id: true, name: true } } } },
          },
        },
        organization: { select: { id: true, name: true } },
      },
    });
    if (!code) {
      this.logger.warn(`redeem: code not found`);
      throw new NotFoundException('초대 코드를 찾을 수 없습니다.');
    }

    if (code.type !== InviteCodeType.PARENT_LINK || !code.child) {
      throw new BadRequestException('학부모 연결용 코드가 아닙니다.');
    }
    if (code.status === InviteCodeStatus.USED) {
      throw new ConflictException('이미 사용된 코드입니다.');
    }
    if (code.status === InviteCodeStatus.REVOKED) {
      throw new BadRequestException('취소된 코드입니다.');
    }
    if (code.status === InviteCodeStatus.EXPIRED || code.expiresAt < new Date()) {
      // 만료 코드는 상태를 정리해두고 거절
      if (code.status === InviteCodeStatus.ACTIVE) {
        await this.prisma.inviteCode.update({
          where: { id: code.id },
          data: { status: InviteCodeStatus.EXPIRED },
        });
      }
      throw new BadRequestException('만료된 코드입니다.');
    }

    const existingLink = await this.prisma.parentChildLink.findUnique({
      where: { parentId_childId: { parentId: parentProfile.id, childId: code.child.id } },
    });
    if (existingLink) {
      this.logger.warn(
        `redeem: parent=${parentProfile.id} already linked to child=${code.child.id}`,
      );
      throw new ConflictException('이미 연결된 아동입니다.');
    }

    await this.prisma.$transaction([
      this.prisma.parentChildLink.create({
        data: { parentId: parentProfile.id, childId: code.child.id, relation: dto.relation },
      }),
      this.prisma.inviteCode.update({
        where: { id: code.id },
        data: {
          status: InviteCodeStatus.USED,
          usedAt: new Date(),
          usedByParentId: parentProfile.id,
        },
      }),
    ]);

    this.logger.log(`redeem: parent=${parentProfile.id} linked to child=${code.child.id}`);

    const primary = code.child.primaryTherapist;
    return {
      child: { id: code.child.id, name: code.child.name },
      organization: { id: code.organization.id, name: code.organization.name },
      primaryTherapist: primary ? { id: primary.user.id, name: primary.user.name } : null,
      relation: dto.relation,
    };
  }

  // ==================== helpers ====================

  /** 요청자의 치료사 프로필 + 활성 멤버십(기관 컨텍스트)을 해석한다. */
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

  private async generateUniqueCode(): Promise<string> {
    // 8자리 hex를 XXXX-XXXX 형태로. @unique 충돌 시 최대 5회 재시도.
    for (let attempt = 0; attempt < 5; attempt++) {
      const raw = randomBytes(4).toString('hex').toUpperCase();
      const code = `${raw.slice(0, 4)}-${raw.slice(4)}`;
      const existing = await this.prisma.inviteCode.findUnique({ where: { code } });
      if (!existing) return code;
    }
    throw new ConflictException('초대 코드 생성에 실패했습니다. 다시 시도해주세요.');
  }

  private toDto(code: {
    id: string;
    code: string;
    type: string;
    status: string;
    expiresAt: Date;
    createdAt: Date;
    child: { id: string; name: string } | null;
    organization: { id: string; name: string };
  }): InviteCodeResponseDto {
    return {
      id: code.id,
      code: code.code,
      type: code.type as InviteCodeType,
      status: code.status as InviteCodeStatus,
      expiresAt: code.expiresAt.toISOString(),
      createdAt: code.createdAt.toISOString(),
      child: code.child ? { id: code.child.id, name: code.child.name } : null,
      organization: { id: code.organization.id, name: code.organization.name },
    };
  }
}
