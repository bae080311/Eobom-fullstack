import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrgMemberRole, OrgMembershipStatus } from '@eobom/shared';

import { OrganizationsService } from './organizations.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

// ---------------------------------------------------------------------------
// Prisma mock factory
// ---------------------------------------------------------------------------

const makePrisma = () => {
  const prisma = {
    therapistProfile: { findUnique: vi.fn() },
    organizationMembership: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    organization: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  // 서비스는 $transaction(cb, opts)를 호출하므로, cb에 동일한 mock을 tx로 전달해 그대로 재사용한다.
  prisma.$transaction.mockImplementation((cb: (tx: typeof prisma) => unknown) => cb(prisma));
  return prisma;
};

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const makeProfile = (overrides?: object) => ({ id: 'tp1', userId: 'u1', ...overrides });

const makeMembership = (overrides?: object) => ({
  id: 'mem1',
  organizationId: 'org1',
  therapistProfileId: 'tp1',
  role: OrgMemberRole.OWNER,
  status: OrgMembershipStatus.ACTIVE,
  joinedAt: new Date('2025-01-01T00:00:00Z'),
  therapistProfile: { id: 'tp1', user: { id: 'u1', name: '이치료', email: 't@x.com' } },
  ...overrides,
});

const makeOrg = (overrides?: object) => ({
  id: 'org1',
  name: '이어봄 클리닉',
  joinCode: 'ABCD1234',
  joinCodeRotatedAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new OrganizationsService(prisma as unknown as PrismaService);
  });

  // -------------------------------------------------------------------------
  // findMine
  // -------------------------------------------------------------------------

  describe('findMine', () => {
    it('활성 멤버십이 있으면 OrganizationResponseDto를 반환한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue({
        ...makeMembership(),
        organization: makeOrg(),
      });

      const result = await service.findMine('u1');

      expect(result.id).toBe('org1');
      expect(result.name).toBe('이어봄 클리닉');
      expect(result.joinCode).toBe('ABCD1234');
      expect(result.membership).toEqual({ id: 'mem1', role: OrgMemberRole.OWNER });
    });

    it('활성 멤버십이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(null);

      await expect(service.findMine('u1')).rejects.toThrow(NotFoundException);
    });

    it('치료사 프로필이 없으면 ForbiddenException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(null);

      await expect(service.findMine('unknown')).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  describe('update', () => {
    it('OWNER가 아니면 ForbiddenException을 던지고 업데이트하지 않는다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(
        makeMembership({ role: OrgMemberRole.THERAPIST }),
      );

      await expect(service.update('u1', 'org1', { name: '새 이름' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.organization.update).not.toHaveBeenCalled();
    });

    it('OWNER면 기관 이름을 수정한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.organization.update.mockResolvedValue(makeOrg({ name: '새 이름' }));

      const result = await service.update('u1', 'org1', { name: '새 이름' });

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org1' },
        data: { name: '새 이름' },
      });
      expect(result.name).toBe('새 이름');
    });

    it('name이 없으면 BadRequestException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());

      await expect(service.update('u1', 'org1', {})).rejects.toThrow(BadRequestException);
      expect(prisma.organization.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // rotateJoinCode
  // -------------------------------------------------------------------------

  describe('rotateJoinCode', () => {
    it('OWNER가 아니면 ForbiddenException을 던지고 재발급하지 않는다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(
        makeMembership({ role: OrgMemberRole.THERAPIST }),
      );

      await expect(service.rotateJoinCode('u1', 'org1')).rejects.toThrow(ForbiddenException);
      expect(prisma.organization.update).not.toHaveBeenCalled();
    });

    it('OWNER면 joinCode를 재발급한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.organization.findUnique.mockResolvedValue(null); // joinCode 충돌 없음
      prisma.organization.update.mockResolvedValue(
        makeOrg({ joinCode: 'NEWCODE1', joinCodeRotatedAt: new Date('2025-02-01T00:00:00Z') }),
      );

      const result = await service.rotateJoinCode('u1', 'org1');

      expect(result.joinCode).toBe('NEWCODE1');
      expect(result.rotatedAt).toBe('2025-02-01T00:00:00.000Z');
    });
  });

  // -------------------------------------------------------------------------
  // findMembers
  // -------------------------------------------------------------------------

  describe('findMembers', () => {
    it('활성 멤버라면 누구나(OWNER가 아니어도) 멤버 목록을 MemberResponseDto[]로 조회한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(
        makeMembership({ role: OrgMemberRole.THERAPIST }),
      );
      prisma.organizationMembership.findMany.mockResolvedValue([makeMembership()]);

      const result = await service.findMembers('u1', 'org1');

      expect(result).toEqual([
        {
          id: 'mem1',
          therapistProfileId: 'tp1',
          role: OrgMemberRole.OWNER,
          status: OrgMembershipStatus.ACTIVE,
          joinedAt: '2025-01-01T00:00:00.000Z',
          user: { id: 'u1', name: '이치료', email: 't@x.com' },
        },
      ]);
    });

    it('해당 기관의 멤버가 아니면 ForbiddenException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(null);

      await expect(service.findMembers('u1', 'org1')).rejects.toThrow(ForbiddenException);
      expect(prisma.organizationMembership.findMany).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // updateMember
  // -------------------------------------------------------------------------

  describe('updateMember', () => {
    it('호출자가 OWNER가 아니면 ForbiddenException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(
        makeMembership({ role: OrgMemberRole.THERAPIST }),
      );

      await expect(
        service.updateMember('u1', 'org1', 'mem2', { role: OrgMemberRole.OWNER }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.organizationMembership.update).not.toHaveBeenCalled();
    });

    it('대상 멤버가 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst
        .mockResolvedValueOnce(makeMembership()) // caller: OWNER
        .mockResolvedValueOnce(null); // target 조회

      await expect(
        service.updateMember('u1', 'org1', 'mem-none', { role: OrgMemberRole.THERAPIST }),
      ).rejects.toThrow(NotFoundException);
    });

    it('마지막 남은 OWNER를 강등하려 하면 BadRequestException을 던지고 업데이트하지 않는다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst
        .mockResolvedValueOnce(makeMembership()) // caller: OWNER
        .mockResolvedValueOnce(makeMembership({ id: 'mem1', role: OrgMemberRole.OWNER })); // target = 자기 자신, OWNER
      prisma.organizationMembership.count.mockResolvedValue(1); // OWNER가 1명뿐

      await expect(
        service.updateMember('u1', 'org1', 'mem1', { role: OrgMemberRole.THERAPIST }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.organizationMembership.update).not.toHaveBeenCalled();
    });

    it('OWNER가 다른 멤버의 역할을 변경하면 성공한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst
        .mockResolvedValueOnce(makeMembership()) // caller: OWNER
        .mockResolvedValueOnce(makeMembership({ id: 'mem2', role: OrgMemberRole.THERAPIST })); // target
      prisma.organizationMembership.update.mockResolvedValue(
        makeMembership({ id: 'mem2', role: OrgMemberRole.OWNER }),
      );

      const result = await service.updateMember('u1', 'org1', 'mem2', {
        role: OrgMemberRole.OWNER,
      });

      expect(prisma.organizationMembership.count).not.toHaveBeenCalled();
      expect(prisma.organizationMembership.update).toHaveBeenCalledWith({
        where: { id: 'mem2' },
        data: { role: OrgMemberRole.OWNER },
        include: { therapistProfile: { include: { user: true } } },
      });
      expect(result.role).toBe(OrgMemberRole.OWNER);
    });
  });

  // -------------------------------------------------------------------------
  // leaveMember
  // -------------------------------------------------------------------------

  describe('leaveMember', () => {
    it('본인 탈퇴는 허용된다(마지막 OWNER가 아닌 경우)', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst
        .mockResolvedValueOnce(makeMembership({ role: OrgMemberRole.THERAPIST })) // caller
        .mockResolvedValueOnce(makeMembership({ role: OrgMemberRole.THERAPIST })); // target = 자기 자신

      await service.leaveMember('u1', 'org1', 'mem1');

      expect(prisma.organizationMembership.count).not.toHaveBeenCalled();
      expect(prisma.organizationMembership.update).toHaveBeenCalledWith({
        where: { id: 'mem1' },
        data: { status: OrgMembershipStatus.LEFT, leftAt: expect.any(Date) },
      });
    });

    it('OWNER가 아닌 멤버가 다른 멤버를 내보내려 하면 ForbiddenException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst
        .mockResolvedValueOnce(makeMembership({ id: 'mem1', role: OrgMemberRole.THERAPIST })) // caller
        .mockResolvedValueOnce(makeMembership({ id: 'mem2', role: OrgMemberRole.THERAPIST })); // target

      await expect(service.leaveMember('u1', 'org1', 'mem2')).rejects.toThrow(ForbiddenException);
      expect(prisma.organizationMembership.update).not.toHaveBeenCalled();
    });

    it('OWNER는 다른 멤버를 내보낼 수 있다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst
        .mockResolvedValueOnce(makeMembership({ id: 'mem1', role: OrgMemberRole.OWNER })) // caller
        .mockResolvedValueOnce(makeMembership({ id: 'mem2', role: OrgMemberRole.THERAPIST })); // target

      await service.leaveMember('u1', 'org1', 'mem2');

      expect(prisma.organizationMembership.count).not.toHaveBeenCalled();
      expect(prisma.organizationMembership.update).toHaveBeenCalledWith({
        where: { id: 'mem2' },
        data: { status: OrgMembershipStatus.LEFT, leftAt: expect.any(Date) },
      });
    });

    it('마지막 남은 OWNER가 탈퇴하려 하면 BadRequestException을 던지고 업데이트하지 않는다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst
        .mockResolvedValueOnce(makeMembership({ id: 'mem1', role: OrgMemberRole.OWNER })) // caller
        .mockResolvedValueOnce(makeMembership({ id: 'mem1', role: OrgMemberRole.OWNER })); // target = 자기 자신
      prisma.organizationMembership.count.mockResolvedValue(1);

      await expect(service.leaveMember('u1', 'org1', 'mem1')).rejects.toThrow(BadRequestException);
      expect(prisma.organizationMembership.update).not.toHaveBeenCalled();
    });

    it('대상 멤버가 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst
        .mockResolvedValueOnce(makeMembership())
        .mockResolvedValueOnce(null);

      await expect(service.leaveMember('u1', 'org1', 'mem-none')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
