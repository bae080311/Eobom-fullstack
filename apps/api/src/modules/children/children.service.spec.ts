import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ScheduleStatus, UserRole, OrgMembershipStatus, OrgMemberRole } from '@eobom/shared';
import type { IUser } from '@eobom/shared';

import { ChildrenService } from './children.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

// ---------------------------------------------------------------------------
// Prisma mock factory
// ---------------------------------------------------------------------------

const makePrisma = () => ({
  therapistProfile: { findUnique: vi.fn() },
  parentProfile: { findUnique: vi.fn() },
  organizationMembership: { findFirst: vi.fn() },
  parentChildLink: { findUnique: vi.fn() },
  child: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const makeProfile = (overrides?: object) => ({ id: 'tp1', userId: 'u1', ...overrides });

const makeParentProfile = (overrides?: object) => ({ id: 'pp1', userId: 'pu1', ...overrides });

const makeMembership = (overrides?: object) => ({
  id: 'm1',
  organizationId: 'org1',
  therapistProfileId: 'tp1',
  role: OrgMemberRole.THERAPIST,
  status: OrgMembershipStatus.ACTIVE,
  ...overrides,
});

const makeChildRow = (overrides?: object) => ({
  id: 'c1',
  name: '도윤',
  birthDate: new Date('2019-03-01T00:00:00Z'),
  memo: null,
  organizationId: 'org1',
  primaryTherapistId: 'tp1',
  schedules: [{ startAt: new Date('2026-06-20T01:00:00Z') }],
  ...overrides,
});

const therapistUser: IUser = {
  id: 'u1',
  email: 't@x.com',
  name: '이치료',
  role: UserRole.THERAPIST,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

const parentUser: IUser = {
  id: 'pu1',
  email: 'p@x.com',
  name: '김부모',
  role: UserRole.PARENT,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ChildrenService', () => {
  let service: ChildrenService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new ChildrenService(prisma as unknown as PrismaService);
  });

  describe('findAll (therapist)', () => {
    it('치료사 프로필이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(null);

      await expect(service.findAll(therapistUser)).rejects.toThrow(NotFoundException);
    });

    it('아동 목록을 ChildResponseDto 배열로 매핑한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.child.findMany.mockResolvedValue([makeChildRow()]);

      const result = await service.findAll(therapistUser);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'c1',
        name: '도윤',
        birthDate: '2019-03-01T00:00:00.000Z',
        memo: null,
        nextSessionAt: '2026-06-20T01:00:00.000Z',
      });
    });

    it('birthDate가 null이고 예정 일정이 없으면 둘 다 null로 매핑한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.child.findMany.mockResolvedValue([makeChildRow({ birthDate: null, schedules: [] })]);

      const result = await service.findAll(therapistUser);

      expect(result[0].birthDate).toBeNull();
      expect(result[0].nextSessionAt).toBeNull();
    });

    it('합집합 where(OR)와 name 정렬로 조회한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.child.findMany.mockResolvedValue([]);

      await service.findAll(therapistUser);

      const arg = prisma.child.findMany.mock.calls[0][0];
      expect(arg.where.OR).toEqual([
        { primaryTherapistId: 'tp1' },
        { schedules: { some: { therapistId: 'tp1' } } },
      ]);
      expect(arg.orderBy).toEqual({ name: 'asc' });
    });

    it('예정 일정 include는 SCHEDULED·RESCHEDULED만, 가장 이른 1건을 가져온다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.child.findMany.mockResolvedValue([]);

      await service.findAll(therapistUser);

      const include = prisma.child.findMany.mock.calls[0][0].include;
      expect(include.schedules.where.therapistId).toBe('tp1');
      expect(include.schedules.where.status.in).toEqual([
        ScheduleStatus.SCHEDULED,
        ScheduleStatus.RESCHEDULED,
      ]);
      expect(include.schedules.where.startAt.gte).toBeInstanceOf(Date);
      expect(include.schedules.take).toBe(1);
      expect(include.schedules.orderBy).toEqual({ startAt: 'asc' });
    });
  });

  describe('findAll (parent)', () => {
    it('학부모 프로필이 없으면 NotFoundException을 던진다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(null);

      await expect(service.findAll(parentUser)).rejects.toThrow(NotFoundException);
      expect(prisma.child.findMany).not.toHaveBeenCalled();
    });

    it('연결된 아동 목록을 ChildResponseDto 배열로 매핑한다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.child.findMany.mockResolvedValue([makeChildRow()]);

      const result = await service.findAll(parentUser);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'c1',
        name: '도윤',
        birthDate: '2019-03-01T00:00:00.000Z',
        memo: null,
        nextSessionAt: '2026-06-20T01:00:00.000Z',
      });
    });

    it('parentLinks.some.parentId로 연결된 아동만 조회한다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.child.findMany.mockResolvedValue([]);

      await service.findAll(parentUser);

      const arg = prisma.child.findMany.mock.calls[0][0];
      expect(arg.where).toEqual({ parentLinks: { some: { parentId: 'pp1' } } });
      expect(arg.orderBy).toEqual({ name: 'asc' });
    });
  });

  describe('findOne', () => {
    it('학부모는 연결된 아동만 조회할 수 있다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.parentChildLink.findUnique.mockResolvedValue(null);

      await expect(service.findOne('c1', parentUser)).rejects.toThrow(NotFoundException);
    });

    it('학부모가 연결된 아동은 상세로 반환한다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.parentChildLink.findUnique.mockResolvedValue({ id: 'link1' });
      prisma.child.findUniqueOrThrow.mockResolvedValue(makeChildRow());

      const result = await service.findOne('c1', parentUser);
      expect(result.id).toBe('c1');
    });

    it('치료사는 다른 기관 아동을 조회하면 NotFoundException', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.child.findUnique.mockResolvedValue(makeChildRow({ organizationId: 'org-other' }));

      await expect(service.findOne('c1', therapistUser)).rejects.toThrow(NotFoundException);
    });

    it('같은 기관 치료사는 아동 상세를 조회할 수 있다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.child.findUnique.mockResolvedValue(makeChildRow());
      prisma.child.findUniqueOrThrow.mockResolvedValue(makeChildRow());

      const result = await service.findOne('c1', therapistUser);
      expect(result.id).toBe('c1');
    });
  });

  describe('create', () => {
    it('활성 멤버십이 없으면 NotFoundException', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(null);

      await expect(service.create({ name: '새 아동' }, 'u1')).rejects.toThrow(NotFoundException);
    });

    it('primaryTherapistId 미지정 시 본인을 담당자로 지정한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValueOnce(makeMembership());
      prisma.child.create.mockResolvedValue(makeChildRow());
      prisma.child.findUniqueOrThrow.mockResolvedValue(makeChildRow());

      await service.create({ name: '새 아동' }, 'u1');

      const arg = prisma.child.create.mock.calls[0][0];
      expect(arg.data.primaryTherapistId).toBe('tp1');
      expect(arg.data.organizationId).toBe('org1');
    });

    it('다른 기관 치료사를 담당자로 지정하면 BadRequestException', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst
        .mockResolvedValueOnce(makeMembership())
        .mockResolvedValueOnce(null);

      await expect(
        service.create({ name: '새 아동', primaryTherapistId: 'tp2' }, 'u1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.child.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('다른 기관 아동을 수정하려 하면 NotFoundException', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.child.findUnique.mockResolvedValue(makeChildRow({ organizationId: 'org-other' }));

      await expect(service.update('c1', { name: '수정' }, 'u1')).rejects.toThrow(NotFoundException);
      expect(prisma.child.update).not.toHaveBeenCalled();
    });

    it('지정된 필드만 갱신한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.child.findUnique.mockResolvedValue(makeChildRow());
      prisma.child.update.mockResolvedValue(makeChildRow());
      prisma.child.findUniqueOrThrow.mockResolvedValue(makeChildRow());

      await service.update('c1', { memo: '조음 주의' }, 'u1');

      const arg = prisma.child.update.mock.calls[0][0];
      expect(arg.data).toEqual({ memo: '조음 주의' });
    });
  });

  describe('remove', () => {
    it('담당 치료사도 OWNER도 아니면 ForbiddenException', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(
        makeMembership({ role: OrgMemberRole.THERAPIST }),
      );
      prisma.child.findUnique.mockResolvedValue(makeChildRow({ primaryTherapistId: 'tp2' }));

      await expect(service.remove('c1', 'u1')).rejects.toThrow(ForbiddenException);
      expect(prisma.child.delete).not.toHaveBeenCalled();
    });

    it('담당 치료사 본인이면 삭제할 수 있다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(
        makeMembership({ role: OrgMemberRole.THERAPIST }),
      );
      prisma.child.findUnique.mockResolvedValue(makeChildRow({ primaryTherapistId: 'tp1' }));

      await service.remove('c1', 'u1');
      expect(prisma.child.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });

    it('OWNER는 담당 치료사가 아니어도 삭제할 수 있다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(
        makeMembership({ role: OrgMemberRole.OWNER }),
      );
      prisma.child.findUnique.mockResolvedValue(makeChildRow({ primaryTherapistId: 'tp2' }));

      await service.remove('c1', 'u1');
      expect(prisma.child.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });
  });

  describe('setPrimaryTherapist', () => {
    it('권한 없는 치료사가 시도하면 ForbiddenException', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(
        makeMembership({ role: OrgMemberRole.THERAPIST }),
      );
      prisma.child.findUnique.mockResolvedValue(makeChildRow({ primaryTherapistId: 'tp2' }));

      await expect(
        service.setPrimaryTherapist('c1', { primaryTherapistId: 'tp2' }, 'u1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('다른 기관 치료사로 지정하면 BadRequestException', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst
        .mockResolvedValueOnce(makeMembership({ role: OrgMemberRole.OWNER }))
        .mockResolvedValueOnce(null);
      prisma.child.findUnique.mockResolvedValue(makeChildRow());

      await expect(
        service.setPrimaryTherapist('c1', { primaryTherapistId: 'tp-outside' }, 'u1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.child.update).not.toHaveBeenCalled();
    });

    it('OWNER는 같은 기관 치료사로 담당자를 변경할 수 있다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst
        .mockResolvedValueOnce(makeMembership({ role: OrgMemberRole.OWNER }))
        .mockResolvedValueOnce(makeMembership({ therapistProfileId: 'tp2' }));
      prisma.child.findUnique.mockResolvedValue(makeChildRow());
      prisma.child.update.mockResolvedValue(makeChildRow({ primaryTherapistId: 'tp2' }));
      prisma.child.findUniqueOrThrow.mockResolvedValue(makeChildRow({ primaryTherapistId: 'tp2' }));

      await service.setPrimaryTherapist('c1', { primaryTherapistId: 'tp2' }, 'u1');

      expect(prisma.child.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { primaryTherapistId: 'tp2' },
      });
    });
  });
});
