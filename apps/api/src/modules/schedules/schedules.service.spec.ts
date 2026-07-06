import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ScheduleStatus, OrgMembershipStatus, UserRole } from '@eobom/shared';
import type { IUser } from '@eobom/shared';

import { SchedulesService } from './schedules.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

// ---------------------------------------------------------------------------
// Prisma mock factory
// ---------------------------------------------------------------------------

const makePrisma = () => ({
  therapistProfile: { findUnique: vi.fn() },
  parentProfile: { findUnique: vi.fn() },
  parentChildLink: { findUnique: vi.fn(), findMany: vi.fn() },
  organizationMembership: { findFirst: vi.fn() },
  scheduleAcknowledgement: { upsert: vi.fn() },
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

// findOne/acknowledge가 반환하는 detail 형태(치료사 이름·확인 목록 포함)
const makeDetailRow = (overrides?: object) => ({
  ...makeScheduleRow(),
  therapist: { user: { name: '이치료' } },
  acknowledgements: [] as Array<{ acknowledgedAt: Date }>,
  ...overrides,
});

const makeParentProfile = (overrides?: object) => ({ id: 'pp1', userId: 'pu1', ...overrides });

const makeLink = (overrides?: object) => ({
  id: 'link1',
  parentId: 'pp1',
  childId: 'c1',
  relation: 'MOTHER',
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

  describe('findAll (therapist)', () => {
    it('치료사 프로필이 있으면 일정 목록을 ScheduleResponseDto 배열로 반환한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findMany.mockResolvedValue([makeScheduleRow()]);

      const result = await service.findAll({}, therapistUser);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
      expect(result[0].childName).toBe('김아동');
      expect(result[0].startAt).toBe('2025-06-01T10:00:00.000Z');
    });

    it('치료사 프로필이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(null);

      await expect(service.findAll({}, therapistUser)).rejects.toThrow(NotFoundException);
    });

    it('from 파라미터가 있으면 findMany where 절에 gte 조건이 포함된다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findMany.mockResolvedValue([]);

      await service.findAll({ from: '2025-06-01' }, therapistUser);

      const whereArg = prisma.schedule.findMany.mock.calls[0][0].where;
      expect(whereArg.startAt.gte).toEqual(new Date('2025-06-01'));
    });

    it('to 파라미터가 있으면 findMany where 절에 lte 조건이 포함된다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findMany.mockResolvedValue([]);

      await service.findAll({ to: '2025-06-30' }, therapistUser);

      const whereArg = prisma.schedule.findMany.mock.calls[0][0].where;
      expect(whereArg.startAt.lte).toEqual(new Date('2025-06-30'));
    });

    it('from과 to를 동시에 전달하면 gte·lte가 모두 포함된다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findMany.mockResolvedValue([]);

      await service.findAll({ from: '2025-06-01', to: '2025-06-30' }, therapistUser);

      const whereArg = prisma.schedule.findMany.mock.calls[0][0].where;
      expect(whereArg.startAt.gte).toEqual(new Date('2025-06-01'));
      expect(whereArg.startAt.lte).toEqual(new Date('2025-06-30'));
    });
  });

  describe('findAll (parent)', () => {
    it('학부모 프로필이 없으면 NotFoundException을 던진다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(null);

      await expect(service.findAll({}, parentUser)).rejects.toThrow(NotFoundException);
      expect(prisma.schedule.findMany).not.toHaveBeenCalled();
    });

    it('연결된 아동들의 childId로 조회하고 therapistName을 매핑한다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.parentChildLink.findMany.mockResolvedValue([{ childId: 'c1' }, { childId: 'c2' }]);
      prisma.schedule.findMany.mockResolvedValue([
        { ...makeScheduleRow(), therapist: { user: { name: '이치료' } } },
      ]);

      const result = await service.findAll({}, parentUser);

      const linkArg = prisma.parentChildLink.findMany.mock.calls[0][0];
      expect(linkArg.where).toEqual({ parentId: 'pp1' });

      const whereArg = prisma.schedule.findMany.mock.calls[0][0].where;
      expect(whereArg.childId).toEqual({ in: ['c1', 'c2'] });

      expect(result).toHaveLength(1);
      expect(result[0].therapistName).toBe('이치료');
    });

    it('연결된 아동이 없으면 빈 배열을 childId.in에 전달한다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.parentChildLink.findMany.mockResolvedValue([]);
      prisma.schedule.findMany.mockResolvedValue([]);

      const result = await service.findAll({}, parentUser);

      const whereArg = prisma.schedule.findMany.mock.calls[0][0].where;
      expect(whereArg.childId).toEqual({ in: [] });
      expect(result).toEqual([]);
    });

    it('from·to·status 필터가 where 절에 포함된다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.parentChildLink.findMany.mockResolvedValue([{ childId: 'c1' }]);
      prisma.schedule.findMany.mockResolvedValue([]);

      await service.findAll(
        { from: '2025-06-01', to: '2025-06-30', status: ScheduleStatus.SCHEDULED },
        parentUser,
      );

      const whereArg = prisma.schedule.findMany.mock.calls[0][0].where;
      expect(whereArg.startAt.gte).toEqual(new Date('2025-06-01'));
      expect(whereArg.startAt.lte).toEqual(new Date('2025-06-30'));
      expect(whereArg.status).toBe(ScheduleStatus.SCHEDULED);
    });
  });

  // -------------------------------------------------------------------------
  // findOne
  // -------------------------------------------------------------------------

  describe('findOne (therapist)', () => {
    it('자신의 일정이면 ScheduleDetailResponseDto를 반환한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(makeDetailRow());

      const result = await service.findOne('s1', therapistUser);

      expect(result.id).toBe('s1');
      expect(result.therapistId).toBe('tp1');
      expect(result.therapistName).toBe('이치료');
      expect(result.acknowledged).toBe(false);
      expect(result.acknowledgedAt).toBeNull();
    });

    it('임의 학부모가 확인한 일정이면 acknowledged=true로 표시한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(
        makeDetailRow({ acknowledgements: [{ acknowledgedAt: new Date('2025-06-02T00:00:00Z') }] }),
      );

      const result = await service.findOne('s1', therapistUser);

      expect(result.acknowledged).toBe(true);
      expect(result.acknowledgedAt).toBe('2025-06-02T00:00:00.000Z');
    });

    it('치료사 프로필이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOne('s1', therapistUser)).rejects.toThrow(NotFoundException);
    });

    it('일정이 존재하지 않으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.findOne('no-such-id', therapistUser)).rejects.toThrow(NotFoundException);
    });

    it('다른 치료사의 일정이면 ForbiddenException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile({ id: 'tp1' }));
      prisma.schedule.findUnique.mockResolvedValue(makeDetailRow({ therapistId: 'tp-other' }));

      await expect(service.findOne('s1', therapistUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne (parent)', () => {
    it('연결된 아동의 일정이면 detail DTO를 반환한다(미확인)', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.schedule.findUnique.mockResolvedValue(makeDetailRow());
      prisma.parentChildLink.findUnique.mockResolvedValue(makeLink());

      const result = await service.findOne('s1', parentUser);

      expect(result.therapistName).toBe('이치료');
      expect(result.acknowledged).toBe(false);
    });

    it('본인이 확인한 일정이면 acknowledged=true이고 본인 ack만 조회한다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.schedule.findUnique.mockResolvedValue(
        makeDetailRow({ acknowledgements: [{ acknowledgedAt: new Date('2025-06-03T00:00:00Z') }] }),
      );
      prisma.parentChildLink.findUnique.mockResolvedValue(makeLink());

      const result = await service.findOne('s1', parentUser);

      expect(result.acknowledged).toBe(true);
      expect(result.acknowledgedAt).toBe('2025-06-03T00:00:00.000Z');

      const includeArg = prisma.schedule.findUnique.mock.calls[0][0].include;
      expect(includeArg.acknowledgements.where).toEqual({ parentId: 'pp1' });
    });

    it('연결되지 않은 아동의 일정이면 ForbiddenException을 던진다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.schedule.findUnique.mockResolvedValue(makeDetailRow());
      prisma.parentChildLink.findUnique.mockResolvedValue(null);

      await expect(service.findOne('s1', parentUser)).rejects.toThrow(ForbiddenException);
    });

    it('학부모 프로필이 없으면 NotFoundException을 던진다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOne('s1', parentUser)).rejects.toThrow(NotFoundException);
    });

    it('일정이 없으면 연결 검사 전에 NotFoundException을 던진다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.findOne('no-such-id', parentUser)).rejects.toThrow(NotFoundException);
      expect(prisma.parentChildLink.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('acknowledge', () => {
    it('확인 레코드를 upsert하고 acknowledged=true detail DTO를 반환한다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.schedule.findUnique
        .mockResolvedValueOnce(makeScheduleRow()) // guard 단계 plain row
        .mockResolvedValueOnce(
          makeDetailRow({
            acknowledgements: [{ acknowledgedAt: new Date('2025-06-04T00:00:00Z') }],
          }),
        ); // findOne 재조회 detail row
      prisma.parentChildLink.findUnique.mockResolvedValue(makeLink());
      prisma.scheduleAcknowledgement.upsert.mockResolvedValue({});

      const result = await service.acknowledge('s1', parentUser);

      expect(prisma.scheduleAcknowledgement.upsert).toHaveBeenCalledOnce();
      const upsertArg = prisma.scheduleAcknowledgement.upsert.mock.calls[0][0];
      expect(upsertArg.where.scheduleId_parentId).toEqual({ scheduleId: 's1', parentId: 'pp1' });
      expect(upsertArg.update).toEqual({});
      expect(result.acknowledged).toBe(true);
      expect(result.acknowledgedAt).toBe('2025-06-04T00:00:00.000Z');
    });

    it('치료사가 호출하면 ForbiddenException을 던지고 upsert하지 않는다', async () => {
      await expect(service.acknowledge('s1', therapistUser)).rejects.toThrow(ForbiddenException);
      expect(prisma.parentProfile.findUnique).not.toHaveBeenCalled();
      expect(prisma.scheduleAcknowledgement.upsert).not.toHaveBeenCalled();
    });

    it('연결되지 않은 아동의 일정이면 ForbiddenException을 던지고 upsert하지 않는다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow());
      prisma.parentChildLink.findUnique.mockResolvedValue(null);

      await expect(service.acknowledge('s1', parentUser)).rejects.toThrow(ForbiddenException);
      expect(prisma.scheduleAcknowledgement.upsert).not.toHaveBeenCalled();
    });

    it('학부모 프로필이 없으면 NotFoundException을 던진다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(null);

      await expect(service.acknowledge('s1', parentUser)).rejects.toThrow(NotFoundException);
    });

    it('일정이 없으면 NotFoundException을 던지고 upsert하지 않는다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.acknowledge('no-such-id', parentUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.scheduleAcknowledgement.upsert).not.toHaveBeenCalled();
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

      // startAt만 변경 시 기존 endAt(11:00)보다 앞인 시각을 전달해야 검증을 통과한다
      const result = await service.update(
        's1',
        { startAt: '2025-06-01T09:00:00Z', endAt: '2025-06-01T11:00:00Z' },
        'u1',
      );

      const updateData = prisma.schedule.update.mock.calls[0][0].data;
      expect(updateData.status).toBe(ScheduleStatus.RESCHEDULED);
      expect(result.status).toBe(ScheduleStatus.RESCHEDULED);
    });

    it('startAt이 endAt 이후이면 BadRequestException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow());

      await expect(
        service.update(
          's1',
          { startAt: '2025-06-01T12:00:00Z', endAt: '2025-06-01T11:00:00Z' },
          'u1',
        ),
      ).rejects.toThrow('시작 시간은 종료 시간보다 빨라야 합니다.');
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
