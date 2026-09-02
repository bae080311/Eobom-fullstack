import type { ScheduleStatus } from '@eobom/shared';

// 상태 라벨 텍스트는 messages/ko.json의 entities.schedule.status 네임스페이스에서
// 상태값(enum)을 키로 그대로 조회한다 — useTranslations/getTranslations는 컴포넌트에서 호출.
export const SCHEDULE_STATUS_COLOR: Record<ScheduleStatus, string> = {
  SCHEDULED: 'bg-brand-soft text-brand-ink',
  RESCHEDULED: 'bg-yellow-100 text-yellow-800',
  CANCELED: 'bg-danger-soft text-danger-strong',
  COMPLETED: 'bg-gray-100 text-gray-700',
};
