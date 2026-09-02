import { NotificationType } from '@eobom/shared';
import type { NotificationResponseDto } from '@eobom/shared';
import type { Notification, NotificationGroup, NotificationVariant } from './types';

type Translate = (key: string, values?: Record<string, string | number>) => string;

const TYPE_VARIANT: Record<NotificationType, NotificationVariant> = {
  [NotificationType.SCHEDULE_CREATED]: 'new',
  [NotificationType.SCHEDULE_UPDATED]: 'reschedule',
  [NotificationType.SCHEDULE_CANCELED]: 'cancel',
};

function formatRelativeTime(createdAt: string, t: Translate): string {
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (mins < 1) return t('justNow');
  if (mins < 60) return t('minutesAgo', { count: mins });
  if (hours < 24) return t('hoursAgo', { count: hours });
  if (days === 1) return t('group.yesterday');
  return t('daysAgo', { count: days });
}

function getGroup(createdAt: string): NotificationGroup {
  const now = new Date();
  const date = new Date(createdAt);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((nowDay - dateDay) / 86_400_000);

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return 'earlier';
}

export function mapDtoToNotification(dto: NotificationResponseDto, t: Translate): Notification {
  return {
    id: dto.id,
    type: TYPE_VARIANT[dto.type],
    title: t(`type.${dto.type}`),
    sub: dto.payload.message,
    time: formatRelativeTime(dto.createdAt, t),
    unread: !dto.isRead,
    group: getGroup(dto.createdAt),
  };
}
