import type { ScheduleStatus } from '@eobom/shared';

export const SCHEDULE_STATUS_LABEL: Record<ScheduleStatus, string> = {
  SCHEDULED: '예정',
  RESCHEDULED: '변경됨',
  CANCELED: '취소됨',
  COMPLETED: '완료',
};

export const SCHEDULE_STATUS_COLOR: Record<ScheduleStatus, string> = {
  SCHEDULED: 'bg-brand-soft text-brand-ink',
  RESCHEDULED: 'bg-yellow-100 text-yellow-800',
  CANCELED: 'bg-danger-soft text-danger',
  COMPLETED: 'bg-gray-100 text-gray-500',
};
