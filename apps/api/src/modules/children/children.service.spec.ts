import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ScheduleStatus, UserRole } from '@eobom/shared';
import type { IUser } from '@eobom/shared';

import { ChildrenService } from './children.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

// ---------------------------------------------------------------------------
// Prisma mock factory
// ---------------------------------------------------------------------------

const makePrisma = () => ({
  therapistProfile: { findUnique: vi.fn() },
  parentProfile: { findUnique: vi.fn() },
  child: { findMany: vi.fn() },
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const makeProfile = (overrides?: object) => ({ id: 'tp1', userId: 'u1', ...overrides });

const makeParentProfile = (overrides?: object) => ({ id: 'pp1', userId: 'pu1', ...overrides });

const makeChildRow = (overrides?: object) => ({
  id: 'c1',
  name: '도윤',
  birthDate: new Date('2019-03-01T00:00:00Z'),
  memo: null,
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
});
