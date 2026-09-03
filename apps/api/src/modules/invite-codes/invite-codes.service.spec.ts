import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  InviteCodeType,
  InviteCodeStatus,
  OrgMemberRole,
  OrgMembershipStatus,
  ParentRelation,
} from '@eobom/shared';

import { InviteCodesService } from './invite-codes.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

// ---------------------------------------------------------------------------
// Prisma mock factory
// ---------------------------------------------------------------------------

const makePrisma = () => {
  const prisma = {
    therapistProfile: { findUnique: vi.fn() },
    parentProfile: { findUnique: vi.fn() },
    organizationMembership: { findFirst: vi.fn() },
    child: { findUnique: vi.fn() },
    inviteCode: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    parentChildLink: { findUnique: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  };
  // 서비스는 $transaction(cb)를 호출하므로, cb에 동일한 mock을 tx로 전달해 그대로 재사용한다.
  prisma.$transaction.mockImplementation((cb: (tx: typeof prisma) => unknown) => cb(prisma));
  return prisma;
};

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const makeProfile = (overrides?: object) => ({ id: 'tp1', userId: 'u1', ...overrides });

const makeParentProfile = (overrides?: object) => ({ id: 'pp1', userId: 'pu1', ...overrides });

const makeMembership = (overrides?: object) => ({
  id: 'mem1',
  organizationId: 'org1',
  therapistProfileId: 'tp1',
  role: OrgMemberRole.THERAPIST,
  status: OrgMembershipStatus.ACTIVE,
  ...overrides,
});

const makeChild = (overrides?: object) => ({
  id: 'c1',
  name: '홍길동',
  organizationId: 'org1',
  primaryTherapistId: 'tp1',
  primaryTherapist: { user: { id: 'tp-u1', name: '김치료' } },
  ...overrides,
});

const makeCode = (overrides?: object) => ({
  id: 'code1',
  code: '7H3K-92AB',
  type: InviteCodeType.PARENT_LINK,
  status: InviteCodeStatus.ACTIVE,
  organizationId: 'org1',
  childId: 'c1',
  issuedById: 'tp1',
  expiresAt: new Date('2099-01-01T00:00:00Z'),
  createdAt: new Date('2025-01-01T00:00:00Z'),
  child: { id: 'c1', name: '홍길동' },
  organization: { id: 'org1', name: '맑은소리 언어치료센터' },
  ...overrides,
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('InviteCodesService', () => {
  let service: InviteCodesService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new InviteCodesService(prisma as unknown as PrismaService);
  });

  // -------------------------------------------------------------------------
  // issueParentLink
  // -------------------------------------------------------------------------

  describe('issueParentLink', () => {
    it('발급자 기관 소속 아동이면 코드를 발급한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.child.findUnique.mockResolvedValue(makeChild());
      prisma.inviteCode.findUnique.mockResolvedValue(null); // 코드 유니크 충돌 없음
      prisma.inviteCode.create.mockResolvedValue(makeCode());

      const result = await service.issueParentLink('u1', { childId: 'c1' });

      expect(prisma.inviteCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ organizationId: 'org1', childId: 'c1' }),
        }),
      );
      expect(result.code).toBe('7H3K-92AB');
    });

    it('아동이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.child.findUnique.mockResolvedValue(null);

      await expect(service.issueParentLink('u1', { childId: 'c-none' })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.inviteCode.create).not.toHaveBeenCalled();
    });

    it('아동이 다른 기관 소속이면 NotFoundException을 던진다 (org-scope, 존재 비노출)', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(
        makeMembership({ organizationId: 'org1' }),
      );
      prisma.child.findUnique.mockResolvedValue(makeChild({ organizationId: 'org2' }));

      await expect(service.issueParentLink('u1', { childId: 'c1' })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.inviteCode.create).not.toHaveBeenCalled();
    });

    it('치료사 프로필이 없으면 ForbiddenException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(null);

      await expect(service.issueParentLink('unknown', { childId: 'c1' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('활성 멤버십이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(null);

      await expect(service.issueParentLink('u1', { childId: 'c1' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // findAll
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('발급자 본인 기관으로 스코핑된 코드만 조회한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.inviteCode.findMany.mockResolvedValue([makeCode()]);

      await service.findAll('u1');

      expect(prisma.inviteCode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { issuedById: 'tp1', organizationId: 'org1' },
        }),
      );
    });

    it('childId가 주어지면 where에 함께 포함한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.inviteCode.findMany.mockResolvedValue([]);

      await service.findAll('u1', 'c1');

      expect(prisma.inviteCode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { issuedById: 'tp1', organizationId: 'org1', childId: 'c1' },
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // revoke
  // -------------------------------------------------------------------------

  describe('revoke', () => {
    it('발급자 본인이면 취소할 수 있다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.inviteCode.findUnique.mockResolvedValue(makeCode());

      await service.revoke('u1', 'code1');

      expect(prisma.inviteCode.update).toHaveBeenCalledWith({
        where: { id: 'code1' },
        data: { status: InviteCodeStatus.REVOKED },
      });
    });

    it('발급자가 아니어도 같은 기관 OWNER면 취소할 수 있다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile({ id: 'tp-owner' }));
      prisma.organizationMembership.findFirst.mockResolvedValue(
        makeMembership({ therapistProfileId: 'tp-owner', role: OrgMemberRole.OWNER }),
      );
      prisma.inviteCode.findUnique.mockResolvedValue(makeCode({ issuedById: 'tp1' }));

      await service.revoke('owner-user', 'code1');

      expect(prisma.inviteCode.update).toHaveBeenCalled();
    });

    it('같은 기관 소속이어도 발급자·OWNER가 아니면 ForbiddenException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile({ id: 'tp-other' }));
      prisma.organizationMembership.findFirst.mockResolvedValue(
        makeMembership({ therapistProfileId: 'tp-other', role: OrgMemberRole.THERAPIST }),
      );
      prisma.inviteCode.findUnique.mockResolvedValue(makeCode({ issuedById: 'tp1' }));

      await expect(service.revoke('other-user', 'code1')).rejects.toThrow(ForbiddenException);
      expect(prisma.inviteCode.update).not.toHaveBeenCalled();
    });

    it('다른 기관 OWNER면 ForbiddenException을 던진다 (org-scope)', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile({ id: 'tp-owner2' }));
      prisma.organizationMembership.findFirst.mockResolvedValue(
        makeMembership({
          therapistProfileId: 'tp-owner2',
          organizationId: 'org2',
          role: OrgMemberRole.OWNER,
        }),
      );
      prisma.inviteCode.findUnique.mockResolvedValue(makeCode({ organizationId: 'org1' }));

      await expect(service.revoke('owner2-user', 'code1')).rejects.toThrow(ForbiddenException);
      expect(prisma.inviteCode.update).not.toHaveBeenCalled();
    });

    it('코드가 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.inviteCode.findUnique.mockResolvedValue(null);

      await expect(service.revoke('u1', 'code-none')).rejects.toThrow(NotFoundException);
    });

    it('이미 사용/취소된 코드면 ConflictException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.inviteCode.findUnique.mockResolvedValue(makeCode({ status: InviteCodeStatus.USED }));

      await expect(service.revoke('u1', 'code1')).rejects.toThrow(ConflictException);
      expect(prisma.inviteCode.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // redeem
  // -------------------------------------------------------------------------

  describe('redeem', () => {
    it('유효한 코드면 아동과 연결하고 결과를 반환한다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.inviteCode.findUnique.mockResolvedValue(makeCode());
      prisma.parentChildLink.findUnique.mockResolvedValue(null);
      prisma.inviteCode.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.redeem('pu1', {
        code: '7H3K-92AB',
        relation: ParentRelation.MOTHER,
      });

      expect(prisma.parentChildLink.create).toHaveBeenCalledWith({
        data: { parentId: 'pp1', childId: 'c1', relation: ParentRelation.MOTHER },
      });
      expect(result.child).toEqual({ id: 'c1', name: '홍길동' });
    });

    it('학부모 프로필이 없으면 ForbiddenException을 던진다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.redeem('unknown', { code: '7H3K-92AB', relation: ParentRelation.MOTHER }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('코드가 없으면 NotFoundException을 던진다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.inviteCode.findUnique.mockResolvedValue(null);

      await expect(
        service.redeem('pu1', { code: 'NONE-0000', relation: ParentRelation.MOTHER }),
      ).rejects.toThrow(NotFoundException);
    });

    it('학부모 연결용 코드가 아니면 BadRequestException을 던진다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.inviteCode.findUnique.mockResolvedValue(
        makeCode({ type: InviteCodeType.THERAPIST_JOIN, child: null }),
      );

      await expect(
        service.redeem('pu1', { code: '7H3K-92AB', relation: ParentRelation.MOTHER }),
      ).rejects.toThrow(BadRequestException);
    });

    it('이미 사용된 코드면 ConflictException을 던진다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.inviteCode.findUnique.mockResolvedValue(makeCode({ status: InviteCodeStatus.USED }));

      await expect(
        service.redeem('pu1', { code: '7H3K-92AB', relation: ParentRelation.MOTHER }),
      ).rejects.toThrow(ConflictException);
    });

    it('취소된 코드면 BadRequestException을 던진다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.inviteCode.findUnique.mockResolvedValue(
        makeCode({ status: InviteCodeStatus.REVOKED }),
      );

      await expect(
        service.redeem('pu1', { code: '7H3K-92AB', relation: ParentRelation.MOTHER }),
      ).rejects.toThrow(BadRequestException);
    });

    it('만료된 코드면 BadRequestException을 던지고 상태를 EXPIRED로 정리한다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.inviteCode.findUnique.mockResolvedValue(
        makeCode({ status: InviteCodeStatus.ACTIVE, expiresAt: new Date('2020-01-01T00:00:00Z') }),
      );

      await expect(
        service.redeem('pu1', { code: '7H3K-92AB', relation: ParentRelation.MOTHER }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.inviteCode.update).toHaveBeenCalledWith({
        where: { id: 'code1' },
        data: { status: InviteCodeStatus.EXPIRED },
      });
    });

    it('이미 연결된 아동이면 ConflictException을 던진다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.inviteCode.findUnique.mockResolvedValue(makeCode());
      prisma.parentChildLink.findUnique.mockResolvedValue({ parentId: 'pp1', childId: 'c1' });

      await expect(
        service.redeem('pu1', { code: '7H3K-92AB', relation: ParentRelation.MOTHER }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.parentChildLink.create).not.toHaveBeenCalled();
    });

    it('동시 redeem 레이스로 원자적 점유에 실패하면 ConflictException을 던진다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.inviteCode.findUnique.mockResolvedValue(makeCode());
      prisma.parentChildLink.findUnique.mockResolvedValue(null);
      prisma.inviteCode.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.redeem('pu1', { code: '7H3K-92AB', relation: ParentRelation.MOTHER }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.parentChildLink.create).not.toHaveBeenCalled();
    });
  });
});
