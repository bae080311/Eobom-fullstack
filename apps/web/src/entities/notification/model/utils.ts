import { NotificationType } from '@eobom/shared';
import type { NotificationResponseDto } from '@eobom/shared';
import type { Notification, NotificationGroup, NotificationVariant } from './types';

const TYPE_TITLE: Record<NotificationType, string> = {
  [NotificationType.SCHEDULE_CREATED]: '새 일정이 등록되었어요',
  [NotificationType.SCHEDULE_UPDATED]: '일정이 변경되었어요',
  [NotificationType.SCHEDULE_CANCELED]: '일정이 취소되었어요',
};

const TYPE_VARIANT: Record<NotificationType, NotificationVariant> = {
  [NotificationType.SCHEDULE_CREATED]: 'new',
  [NotificationType.SCHEDULE_UPDATED]: 'reschedule',
  [NotificationType.SCHEDULE_CANCELED]: 'cancel',
};

function formatRelativeTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days === 1) return '어제';
  return `${days}일 전`;
}

function getGroup(createdAt: string): NotificationGroup {
  const now = new Date();
  const date = new Date(createdAt);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((nowDay - dateDay) / 86_400_000);

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  return '이전';
}

export function mapDtoToNotification(dto: NotificationResponseDto): Notification {
  return {
    id: dto.id,
    type: TYPE_VARIANT[dto.type],
    title: TYPE_TITLE[dto.type],
    sub: dto.payload.message,
    time: formatRelativeTime(dto.createdAt),
    unread: !dto.isRead,
    group: getGroup(dto.createdAt),
  };
}
