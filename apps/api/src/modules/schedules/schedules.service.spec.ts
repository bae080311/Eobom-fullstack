import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ScheduleStatus, OrgMembershipStatus } from '@eobom/shared';

import { SchedulesService } from './schedules.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

// ---------------------------------------------------------------------------
// Prisma mock factory
// ---------------------------------------------------------------------------

const makePrisma = () => ({
  therapistProfile: { findUnique: vi.fn() },
  organizationMembership: { findFirst: vi.fn() },
  schedule: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const makeProfile = (overrides?: object) => ({
  id: 'tp1',
  userId: 'u1',
  ...overrides,
});

const makeMembership = (overrides?: object) => ({
  id: 'mem1',
  therapistProfileId: 'tp1',
  organizationId: 'org1',
  status: OrgMembershipStatus.ACTIVE,
  ...overrides,
});

const makeScheduleRow = (overrides?: object) => ({
  id: 's1',
  childId: 'c1',
  child: { id: 'c1', name: '김아동' },
  therapistId: 'tp1',
  organizationId: 'org1',
  startAt: new Date('2025-06-01T10:00:00Z'),
  endAt: new Date('2025-06-01T11:00:00Z'),
  status: ScheduleStatus.SCHEDULED,
  title: '언어 치료',
  notes: null,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('SchedulesService', () => {
  let service: SchedulesService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new SchedulesService(prisma as unknown as PrismaService);
  });

  // -------------------------------------------------------------------------
  // findAll
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('치료사 프로필이 있으면 일정 목록을 ScheduleResponseDto 배열로 반환한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findMany.mockResolvedValue([makeScheduleRow()]);

      const result = await service.findAll({}, 'u1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
      expect(result[0].childName).toBe('김아동');
      expect(result[0].startAt).toBe('2025-06-01T10:00:00.000Z');
    });

    it('치료사 프로필이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(null);

      await expect(service.findAll({}, 'unknown')).rejects.toThrow(NotFoundException);
    });

    it('from 파라미터가 있으면 findMany where 절에 gte 조건이 포함된다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findMany.mockResolvedValue([]);

      await service.findAll({ from: '2025-06-01' }, 'u1');

      const whereArg = prisma.schedule.findMany.mock.calls[0][0].where;
      expect(whereArg.startAt.gte).toEqual(new Date('2025-06-01'));
    });

    it('to 파라미터가 있으면 findMany where 절에 lte 조건이 포함된다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findMany.mockResolvedValue([]);

      await service.findAll({ to: '2025-06-30' }, 'u1');

      const whereArg = prisma.schedule.findMany.mock.calls[0][0].where;
      expect(whereArg.startAt.lte).toEqual(new Date('2025-06-30'));
    });

    it('from과 to를 동시에 전달하면 gte·lte가 모두 포함된다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findMany.mockResolvedValue([]);

      await service.findAll({ from: '2025-06-01', to: '2025-06-30' }, 'u1');

      const whereArg = prisma.schedule.findMany.mock.calls[0][0].where;
      expect(whereArg.startAt.gte).toEqual(new Date('2025-06-01'));
      expect(whereArg.startAt.lte).toEqual(new Date('2025-06-30'));
    });
  });

  // -------------------------------------------------------------------------
  // findOne
  // -------------------------------------------------------------------------

  describe('findOne', () => {
    it('자신의 일정이면 ScheduleResponseDto를 반환한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow());

      const result = await service.findOne('s1', 'u1');

      expect(result.id).toBe('s1');
      expect(result.therapistId).toBe('tp1');
    });

    it('치료사 프로필이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOne('s1', 'unknown')).rejects.toThrow(NotFoundException);
    });

    it('일정이 존재하지 않으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.findOne('no-such-id', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('다른 치료사의 일정이면 ForbiddenException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile({ id: 'tp1' }));
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow({ therapistId: 'tp-other' }));

      await expect(service.findOne('s1', 'u1')).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    const baseDto = {
      childId: 'c1',
      startAt: '2025-06-01T10:00:00Z',
      endAt: '2025-06-01T11:00:00Z',
      title: '언어 치료',
    };

    it('일정을 생성하고 ScheduleResponseDto를 반환한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.schedule.create.mockResolvedValue(makeScheduleRow());

      const result = await service.create(baseDto, 'u1');

      expect(result.id).toBe('s1');
      expect(prisma.schedule.create).toHaveBeenCalledOnce();
    });

    it('therapistId 미전달 시 생성 데이터에 profile.id가 사용된다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile({ id: 'tp1' }));
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.schedule.create.mockResolvedValue(makeScheduleRow());

      await service.create(baseDto, 'u1');

      const createData = prisma.schedule.create.mock.calls[0][0].data;
      expect(createData.therapistId).toBe('tp1');
    });

    it('therapistId를 명시적으로 전달하면 해당 값이 사용된다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile({ id: 'tp1' }));
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.schedule.create.mockResolvedValue(makeScheduleRow({ therapistId: 'tp2' }));

      await service.create({ ...baseDto, therapistId: 'tp2' }, 'u1');

      const createData = prisma.schedule.create.mock.calls[0][0].data;
      expect(createData.therapistId).toBe('tp2');
    });

    it('치료사 프로필이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(null);

      await expect(service.create(baseDto, 'unknown')).rejects.toThrow(NotFoundException);
    });

    it('활성 멤버십이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(null);

      await expect(service.create(baseDto, 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  describe('update', () => {
    it('시간 변경 시 status가 RESCHEDULED로 업데이트된다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow());
      prisma.schedule.update.mockResolvedValue(
        makeScheduleRow({ status: ScheduleStatus.RESCHEDULED }),
      );

      const result = await service.update('s1', { startAt: '2025-06-02T10:00:00Z' }, 'u1');

      const updateData = prisma.schedule.update.mock.calls[0][0].data;
      expect(updateData.status).toBe(ScheduleStatus.RESCHEDULED);
      expect(result.status).toBe(ScheduleStatus.RESCHEDULED);
    });

    it('시간 미변경 시 status 필드가 포함되지 않는다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow());
      prisma.schedule.update.mockResolvedValue(makeScheduleRow({ title: '수정된 제목' }));

      await service.update('s1', { title: '수정된 제목' }, 'u1');

      const updateData = prisma.schedule.update.mock.calls[0][0].data;
      expect(updateData.status).toBeUndefined();
    });

    it('notes를 명시적으로 전달하면 업데이트 데이터에 포함된다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow());
      prisma.schedule.update.mockResolvedValue(makeScheduleRow({ notes: '메모 추가' }));

      await service.update('s1', { notes: '메모 추가' }, 'u1');

      const updateData = prisma.schedule.update.mock.calls[0][0].data;
      expect(updateData.notes).toBe('메모 추가');
    });

    it('다른 치료사의 일정이면 ForbiddenException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile({ id: 'tp1' }));
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow({ therapistId: 'tp-other' }));

      await expect(service.update('s1', { title: '수정' }, 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('일정이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.update('no-such-id', { title: '수정' }, 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // cancel
  // -------------------------------------------------------------------------

  describe('cancel', () => {
    it('status가 CANCELED로 업데이트된 ScheduleResponseDto를 반환한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow());
      prisma.schedule.update.mockResolvedValue(
        makeScheduleRow({ status: ScheduleStatus.CANCELED }),
      );

      const result = await service.cancel('s1', 'u1');

      const updateData = prisma.schedule.update.mock.calls[0][0].data;
      expect(updateData.status).toBe(ScheduleStatus.CANCELED);
      expect(result.status).toBe(ScheduleStatus.CANCELED);
    });

    it('다른 치료사의 일정이면 ForbiddenException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile({ id: 'tp1' }));
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow({ therapistId: 'tp-other' }));

      await expect(service.cancel('s1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('일정이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.cancel('no-such-id', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // confirm
  // -------------------------------------------------------------------------

  describe('confirm', () => {
    it('status가 COMPLETED로 업데이트된 ScheduleResponseDto를 반환한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow());
      prisma.schedule.update.mockResolvedValue(
        makeScheduleRow({ status: ScheduleStatus.COMPLETED }),
      );

      const result = await service.confirm('s1', 'u1');

      const updateData = prisma.schedule.update.mock.calls[0][0].data;
      expect(updateData.status).toBe(ScheduleStatus.COMPLETED);
      expect(result.status).toBe(ScheduleStatus.COMPLETED);
    });

    it('다른 치료사의 일정이면 ForbiddenException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile({ id: 'tp1' }));
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow({ therapistId: 'tp-other' }));

      await expect(service.confirm('s1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('일정이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.confirm('no-such-id', 'u1')).rejects.toThrow(NotFoundException);
    });
  });
});
