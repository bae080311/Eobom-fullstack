import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ScheduleStatus } from '@eobom/shared';

import { ChildrenService } from './children.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

// ---------------------------------------------------------------------------
// Prisma mock factory
// ---------------------------------------------------------------------------

const makePrisma = () => ({
  therapistProfile: { findUnique: vi.fn() },
  child: { findMany: vi.fn() },
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const makeProfile = (overrides?: object) => ({ id: 'tp1', userId: 'u1', ...overrides });

const makeChildRow = (overrides?: object) => ({
  id: 'c1',
  name: '도윤',
  birthDate: new Date('2019-03-01T00:00:00Z'),
  memo: null,
  schedules: [{ startAt: new Date('2026-06-20T01:00:00Z') }],
  ...overrides,
});

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

  describe('findAll', () => {
    it('치료사 프로필이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(null);

      await expect(service.findAll('unknown')).rejects.toThrow(NotFoundException);
    });

    it('아동 목록을 ChildResponseDto 배열로 매핑한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.child.findMany.mockResolvedValue([makeChildRow()]);

      const result = await service.findAll('u1');

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

      const result = await service.findAll('u1');

      expect(result[0].birthDate).toBeNull();
      expect(result[0].nextSessionAt).toBeNull();
    });

    it('합집합 where(OR)와 name 정렬로 조회한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.child.findMany.mockResolvedValue([]);

      await service.findAll('u1');

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

      await service.findAll('u1');

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
});
