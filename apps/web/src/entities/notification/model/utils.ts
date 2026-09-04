import { NotificationType } from '@eobom/shared';
import type { NotificationResponseDto } from '@eobom/shared';
import type { Notification, NotificationGroup, NotificationVariant } from './types';
import type { Translate } from '@/shared/lib/i18n';
import koMessages from '../../../../messages/ko.json';

const TYPE_VARIANT: Record<NotificationType, NotificationVariant> = {
  [NotificationType.SCHEDULE_CREATED]: 'new',
  [NotificationType.SCHEDULE_UPDATED]: 'reschedule',
  [NotificationType.SCHEDULE_CANCELED]: 'cancel',
};

// ko.json에 NotificationType 모든 값에 대응하는 키가 있는지 컴파일 타임에 검증한다.
// 신규 타입 추가 시 이 라인이 타입 에러로 알려준다 — 실제 번역은 t(`type.${dto.type}`) 호출이 담당.
export const NOTIFICATION_TYPE_TITLES_KO = koMessages.entities.notification.type satisfies Record<
  NotificationType,
  string
>;

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
  if (days === 1) return t('oneDayAgo');
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

/**
 * "홍길동 · 맑은소리 언어치료센터" 형태의 맥락 문구를 만든다.
 * 아이가 둘 이상인 학부모는 이게 없으면 어느 아이 알림인지 구분할 수 없다.
 * 연결 정보가 사라진 알림(기관 삭제 등)은 있는 것만 이어 붙인다.
 */
function formatContext(dto: NotificationResponseDto): string {
  return [dto.childName, dto.organizationName].filter(Boolean).join(' · ');
}

export function mapDtoToNotification(dto: NotificationResponseDto, t: Translate): Notification {
  return {
    id: dto.id,
    type: TYPE_VARIANT[dto.type],
    title: t(`type.${dto.type}`),
    sub: dto.payload.message,
    context: formatContext(dto),
    time: formatRelativeTime(dto.createdAt, t),
    unread: !dto.isRead,
    group: getGroup(dto.createdAt),
  };
}
