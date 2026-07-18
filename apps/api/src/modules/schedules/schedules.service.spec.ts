import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ScheduleStatus, OrgMembershipStatus, UserRole, NotificationType } from '@eobom/shared';
import type { IUser } from '@eobom/shared';

import { SchedulesService } from './schedules.service.js';
import type { PrismaService } from '../../database/prisma.service.js';
import type { NotificationsService } from '../notifications/notifications.service.js';

// ---------------------------------------------------------------------------
// Prisma mock factory
// ---------------------------------------------------------------------------

const makePrisma = () => {
  const prisma = {
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
      createMany: vi.fn(),
    },
    recurringRule: { create: vi.fn() },
    notification: { createMany: vi.fn() },
    $transaction: vi.fn(),
  };
  // 서비스는 $transaction(cb)를 호출하므로, cb에 동일한 mock을 tx로 전달해 그대로 재사용한다.
  prisma.$transaction.mockImplementation((cb: (tx: typeof prisma) => unknown) => cb(prisma));
  return prisma;
};

// ---------------------------------------------------------------------------
// NotificationsService mock factory
// ---------------------------------------------------------------------------

const makeNotifications = () => ({
  notifyScheduleEvent: vi.fn().mockResolvedValue(undefined),
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const makeProfile = (overrides?: object) => ({
  id: 'tp1',
  userId: 'u1',
  user: { name: '이치료' },
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
  let notifications: ReturnType<typeof makeNotifications>;

  beforeEach(() => {
    prisma = makePrisma();
    notifications = makeNotifications();
    service = new SchedulesService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    );
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

    it('연결된 아동이 없으면 조회 없이 빈 배열을 반환한다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.parentChildLink.findMany.mockResolvedValue([]);

      const result = await service.findAll({}, parentUser);

      expect(prisma.schedule.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('therapist 관계가 없으면 therapistName은 undefined로 매핑한다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(makeParentProfile());
      prisma.parentChildLink.findMany.mockResolvedValue([{ childId: 'c1' }]);
      prisma.schedule.findMany.mockResolvedValue([{ ...makeScheduleRow(), therapist: undefined }]);

      const result = await service.findAll({}, parentUser);

      expect(result[0].therapistName).toBeUndefined();
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

    it('생성 성공 시 SCHEDULE_CREATED 타입으로 알림을 전송한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.schedule.create.mockResolvedValue(makeScheduleRow());

      await service.create(baseDto, 'u1');

      expect(notifications.notifyScheduleEvent).toHaveBeenCalledOnce();
      const arg = notifications.notifyScheduleEvent.mock.calls[0][0];
      expect(arg.type).toBe(NotificationType.SCHEDULE_CREATED);
      expect(arg.scheduleId).toBe('s1');
      expect(arg.childId).toBe('c1');
      expect(arg.organizationId).toBe('org1');
      expect(arg.message).toContain('이치료');
    });
  });

  // -------------------------------------------------------------------------
  // createRecurring
  // -------------------------------------------------------------------------

  describe('createRecurring', () => {
    const baseDto = {
      childId: 'c1',
      title: '언어 치료',
      daysOfWeek: [1, 3], // 월, 수
      startTime: '10:00',
      endTime: '11:00',
      timezone: 'Asia/Seoul',
      startDate: '2025-06-02', // 월요일
      endDate: '2025-06-08', // 그 주 일요일
    };

    const makeRule = (overrides?: object) => ({
      id: 'rule1',
      childId: 'c1',
      therapistId: 'tp1',
      daysOfWeek: [1, 3],
      startTime: '10:00',
      endTime: '11:00',
      timezone: 'Asia/Seoul',
      startDate: new Date('2025-06-02T00:00:00+09:00'),
      endDate: new Date('2025-06-08T00:00:00+09:00'),
      active: true,
      ...overrides,
    });

    const setupSuccess = (rows = [makeScheduleRow(), makeScheduleRow({ id: 's2' })]) => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());
      prisma.recurringRule.create.mockResolvedValue(makeRule());
      prisma.schedule.createMany.mockResolvedValue({ count: rows.length });
      prisma.schedule.findMany.mockResolvedValue(rows);
    };

    it('요일에 해당하는 날짜만 골라 RecurringRule과 Schedule을 생성한다', async () => {
      setupSuccess();

      await service.createRecurring(baseDto, 'u1');

      expect(prisma.recurringRule.create).toHaveBeenCalledOnce();
      const createManyArg = prisma.schedule.createMany.mock.calls[0][0].data;
      expect(createManyArg).toHaveLength(2);
      expect(createManyArg[0].recurringRuleId).toBe('rule1');
      expect(createManyArg[0].startAt.toISOString()).toBe('2025-06-02T01:00:00.000Z');
      expect(createManyArg[1].startAt.toISOString()).toBe('2025-06-04T01:00:00.000Z');
    });

    it('recurringRule과 schedules를 포함한 응답 DTO를 반환한다', async () => {
      setupSuccess();

      const result = await service.createRecurring(baseDto, 'u1');

      expect(result.recurringRule.id).toBe('rule1');
      expect(result.recurringRule.daysOfWeek).toEqual([1, 3]);
      expect(result.schedules).toHaveLength(2);
      expect(result.schedules[0].id).toBe('s1');
    });

    it('therapistId 미전달 시 profile.id가 사용된다', async () => {
      setupSuccess();

      await service.createRecurring(baseDto, 'u1');

      const createManyArg = prisma.schedule.createMany.mock.calls[0][0].data;
      expect(createManyArg[0].therapistId).toBe('tp1');
    });

    it('선택한 요일에 해당하는 날짜가 없으면 BadRequestException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());

      await expect(
        service.createRecurring(
          // 범위를 월요일 하루로 좁히고 화요일만 요구 → 해당하는 날짜 없음
          { ...baseDto, daysOfWeek: [2], startDate: '2025-06-02', endDate: '2025-06-02' },
          'u1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.recurringRule.create).not.toHaveBeenCalled();
    });

    it('생성 건수가 상한을 넘으면 BadRequestException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(makeMembership());

      await expect(
        service.createRecurring(
          { ...baseDto, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], endDate: '2026-06-01' },
          'u1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.recurringRule.create).not.toHaveBeenCalled();
    });

    it('치료사 프로필이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(null);

      await expect(service.createRecurring(baseDto, 'unknown')).rejects.toThrow(NotFoundException);
    });

    it('활성 멤버십이 없으면 NotFoundException을 던진다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.organizationMembership.findFirst.mockResolvedValue(null);

      await expect(service.createRecurring(baseDto, 'u1')).rejects.toThrow(NotFoundException);
    });

    it('생성 성공 시 첫 일정 기준으로 SCHEDULE_CREATED 알림을 1건만 전송한다', async () => {
      setupSuccess();

      await service.createRecurring(baseDto, 'u1');

      expect(notifications.notifyScheduleEvent).toHaveBeenCalledOnce();
      const arg = notifications.notifyScheduleEvent.mock.calls[0][0];
      expect(arg.type).toBe(NotificationType.SCHEDULE_CREATED);
      expect(arg.scheduleId).toBe('s1');
      expect(arg.childId).toBe('c1');
      expect(arg.organizationId).toBe('org1');
      expect(arg.message).toContain('2건');
    });

    it('endDate 미전달 시 RecurringRule의 endDate는 null로 저장된다', async () => {
      setupSuccess();

      await service.createRecurring({ ...baseDto, endDate: undefined }, 'u1');

      const ruleData = prisma.recurringRule.create.mock.calls[0][0].data;
      expect(ruleData.endDate).toBeNull();
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

    it('시간 변경 시 SCHEDULE_UPDATED 타입으로 알림을 전송한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow());
      prisma.schedule.update.mockResolvedValue(
        makeScheduleRow({ status: ScheduleStatus.RESCHEDULED }),
      );

      await service.update(
        's1',
        { startAt: '2025-06-01T09:00:00Z', endAt: '2025-06-01T11:00:00Z' },
        'u1',
      );

      expect(notifications.notifyScheduleEvent).toHaveBeenCalledOnce();
      const arg = notifications.notifyScheduleEvent.mock.calls[0][0];
      expect(arg.type).toBe(NotificationType.SCHEDULE_UPDATED);
      expect(arg.scheduleId).toBe('s1');
      expect(arg.childId).toBe('c1');
      expect(arg.organizationId).toBe('org1');
    });

    it('시간 미변경(제목만 수정)이어도 SCHEDULE_UPDATED 타입으로 알림을 전송한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow());
      prisma.schedule.update.mockResolvedValue(makeScheduleRow({ title: '수정된 제목' }));

      await service.update('s1', { title: '수정된 제목' }, 'u1');

      expect(notifications.notifyScheduleEvent).toHaveBeenCalledOnce();
      expect(notifications.notifyScheduleEvent.mock.calls[0][0].type).toBe(
        NotificationType.SCHEDULE_UPDATED,
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

    it('취소 성공 시 SCHEDULE_CANCELED 타입으로 알림을 전송한다', async () => {
      prisma.therapistProfile.findUnique.mockResolvedValue(makeProfile());
      prisma.schedule.findUnique.mockResolvedValue(makeScheduleRow());
      prisma.schedule.update.mockResolvedValue(
        makeScheduleRow({ status: ScheduleStatus.CANCELED }),
      );

      await service.cancel('s1', 'u1');

      expect(notifications.notifyScheduleEvent).toHaveBeenCalledOnce();
      const arg = notifications.notifyScheduleEvent.mock.calls[0][0];
      expect(arg.type).toBe(NotificationType.SCHEDULE_CANCELED);
      expect(arg.scheduleId).toBe('s1');
      expect(arg.childId).toBe('c1');
      expect(arg.organizationId).toBe('org1');
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
