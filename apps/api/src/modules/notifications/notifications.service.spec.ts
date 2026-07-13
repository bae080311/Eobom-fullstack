import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationType } from '@eobom/shared';

import { NotificationsService } from './notifications.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

// ---------------------------------------------------------------------------
// Prisma mock factory
// ---------------------------------------------------------------------------

const makePrisma = () => ({
  parentChildLink: { findMany: vi.fn() },
  notification: { createMany: vi.fn() },
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
});
