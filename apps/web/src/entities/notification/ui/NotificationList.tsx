'use client';

import { SectionHeader } from '@/shared/ui';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../model/useNotifications';
import { mapDtoToNotification } from '../model/utils';
import { NotificationCard } from './notificationCard';
import type { NotificationResponseDto } from '@eobom/shared';
import type { NotificationGroup } from '../model/types';

const GROUPS: NotificationGroup[] = ['오늘', '어제', '이전'];

interface Props {
  initialData?: NotificationResponseDto[];
}

export function NotificationList({ initialData }: Props) {
  const { data: notifications = [] } = useNotifications(initialData);
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending } = useMarkAllAsRead();

  const items = notifications.map(mapDtoToNotification);
  const unreadCount = items.filter((n) => n.unread).length;

  return (
    <>
      {unreadCount > 0 && (
        <div className="px-5 pt-3 flex justify-end">
          <button
            onClick={() => markAllAsRead()}
            disabled={isPending}
            className="text-body2 text-brand font-semibold disabled:opacity-50"
          >
            전체 읽음
          </button>
        </div>
      )}

      {GROUPS.map((group) => {
        const groupItems = items.filter((n) => n.group === group);
        if (groupItems.length === 0) return null;
        return (
          <section key={group} className="px-5 mt-7">
            <SectionHeader title={group} />
            <div className="flex flex-col gap-2">
              {groupItems.map((n) => (
                <div
                  key={n.id}
                  onClick={() => n.unread && markAsRead(n.id)}
                  className={n.unread ? 'cursor-pointer' : undefined}
                >
                  <NotificationCard notification={n} />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {items.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-20 text-gray-400 text-body">
          새로운 알림이 없어요
        </div>
      )}
    </>
  );
}
