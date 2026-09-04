import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationType } from '@eobom/shared';

import { NotificationsService } from './notifications.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

// ---------------------------------------------------------------------------
// Prisma mock factory
// ---------------------------------------------------------------------------

const makePrisma = () => ({
  parentProfile: { findUnique: vi.fn() },
  parentChildLink: { findMany: vi.fn() },
  notification: {
    createMany: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
});

/** findAll/markAsRead가 조인해서 돌려주는 알림 행 형태. */
const makeNotificationRow = (overrides?: object) => ({
  id: 'n1',
  parentId: 'pp1',
  type: NotificationType.SCHEDULE_CREATED,
  scheduleId: 's1',
  childId: 'c1',
  organization: { name: '맑은소리 언어치료센터' },
  child: { name: '홍길동' },
  schedule: { therapist: { user: { name: '김치료' } } },
  payload: { message: '김치료 치료사님이 새 일정을 등록했습니다' },
  readAt: null,
  createdAt: new Date('2025-06-01T10:00:00Z'),
  ...overrides,
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  describe('notifyScheduleEvent', () => {
    const baseParams = {
      scheduleId: 's1',
      childId: 'c1',
      organizationId: 'org1',
      type: NotificationType.SCHEDULE_CREATED,
      message: '이치료 치료사님이 새 일정을 등록했습니다',
    };

    it('연결된 학부모가 있으면 각 학부모에게 알림을 생성한다', async () => {
      prisma.parentChildLink.findMany.mockResolvedValue([{ parentId: 'pp1' }, { parentId: 'pp2' }]);

      await service.notifyScheduleEvent(baseParams);

      expect(prisma.parentChildLink.findMany).toHaveBeenCalledWith({
        where: { childId: 'c1' },
        select: { parentId: true },
      });
      expect(prisma.notification.createMany).toHaveBeenCalledOnce();
      const data = prisma.notification.createMany.mock.calls[0][0].data;
      expect(data).toEqual([
        {
          parentId: 'pp1',
          type: NotificationType.SCHEDULE_CREATED,
          scheduleId: 's1',
          childId: 'c1',
          organizationId: 'org1',
          payload: { message: baseParams.message },
        },
        {
          parentId: 'pp2',
          type: NotificationType.SCHEDULE_CREATED,
          scheduleId: 's1',
          childId: 'c1',
          organizationId: 'org1',
          payload: { message: baseParams.message },
        },
      ]);
    });

    it('연결된 학부모가 없으면 에러 없이 종료하고 createMany를 호출하지 않는다', async () => {
      prisma.parentChildLink.findMany.mockResolvedValue([]);

      await expect(service.notifyScheduleEvent(baseParams)).resolves.toBeUndefined();

      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });

    it('type을 그대로 payload/컬럼에 전달한다', async () => {
      prisma.parentChildLink.findMany.mockResolvedValue([{ parentId: 'pp1' }]);

      await service.notifyScheduleEvent({
        ...baseParams,
        type: NotificationType.SCHEDULE_CANCELED,
        message: '취소되었습니다',
      });

      const data = prisma.notification.createMany.mock.calls[0][0].data;
      expect(data[0].type).toBe(NotificationType.SCHEDULE_CANCELED);
      expect(data[0].payload).toEqual({ message: '취소되었습니다' });
    });
  });

  // -------------------------------------------------------------------------
  // findAll
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('학부모 프로필이 없으면 NotFoundException을 던진다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue(null);

      await expect(service.findAll('unknown')).rejects.toThrow(NotFoundException);
    });

    it('알림이 어느 아동·기관·치료사의 것인지 함께 반환한다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue({ id: 'pp1', userId: 'pu1' });
      prisma.notification.findMany.mockResolvedValue([makeNotificationRow()]);

      const result = await service.findAll('pu1');

      // 레이어 5 §5.9: 알림은 기관명·치료사명·아동명을 함께 노출한다.
      expect(result[0].childName).toBe('홍길동');
      expect(result[0].organizationName).toBe('맑은소리 언어치료센터');
      expect(result[0].therapistName).toBe('김치료');
      expect(result[0].isRead).toBe(false);
    });

    it('본인 알림만 조회하고 최신순으로 정렬한다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue({ id: 'pp1', userId: 'pu1' });
      prisma.notification.findMany.mockResolvedValue([]);

      await service.findAll('pu1');

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { parentId: 'pp1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('연결된 레코드가 없으면 표시용 필드는 null이다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue({ id: 'pp1', userId: 'pu1' });
      // 기관이 삭제되면 organizationId가 SetNull이 되어 조인 결과가 비어 있을 수 있다.
      prisma.notification.findMany.mockResolvedValue([
        makeNotificationRow({ organization: null, child: null, schedule: null }),
      ]);

      const result = await service.findAll('pu1');

      expect(result[0].organizationName).toBeNull();
      expect(result[0].childName).toBeNull();
      expect(result[0].therapistName).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // markAsRead
  // -------------------------------------------------------------------------

  describe('markAsRead', () => {
    it('다른 학부모의 알림이면 ForbiddenException을 던지고 갱신하지 않는다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue({ id: 'pp1', userId: 'pu1' });
      prisma.notification.findUnique.mockResolvedValue(
        makeNotificationRow({ parentId: 'pp-other' }),
      );

      await expect(service.markAsRead('n1', 'pu1')).rejects.toThrow(ForbiddenException);
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it('읽음 처리 후에도 표시용 필드를 그대로 돌려준다', async () => {
      prisma.parentProfile.findUnique.mockResolvedValue({ id: 'pp1', userId: 'pu1' });
      prisma.notification.findUnique.mockResolvedValue(makeNotificationRow());
      prisma.notification.update.mockResolvedValue(
        makeNotificationRow({ readAt: new Date('2025-06-02T00:00:00Z') }),
      );

      const result = await service.markAsRead('n1', 'pu1');

      expect(result.isRead).toBe(true);
      expect(result.childName).toBe('홍길동');
      expect(result.organizationName).toBe('맑은소리 언어치료센터');
    });
  });
});
