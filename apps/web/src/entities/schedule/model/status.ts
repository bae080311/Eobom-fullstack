import type { ScheduleStatus } from '@eobom/shared';
import koMessages from '../../../../messages/ko.json';

// 상태 라벨 텍스트는 messages/ko.json의 entities.schedule.status 네임스페이스에서
// 상태값(enum)을 키로 그대로 조회한다 — useTranslations/getTranslations는 컴포넌트에서 호출.
// 아래 satisfies는 ScheduleStatus 모든 값에 대응하는 메시지 키가 있는지 컴파일 타임에 검증한다 —
// 신규 상태값 추가 시 ko.json에 키를 빠뜨리면 여기서 타입 에러로 알려준다.
export const SCHEDULE_STATUS_LABELS_KO = koMessages.entities.schedule.status satisfies Record<
  ScheduleStatus,
  string
>;

export const SCHEDULE_STATUS_COLOR: Record<ScheduleStatus, string> = {
  SCHEDULED: 'bg-brand-soft text-brand-ink',
  RESCHEDULED: 'bg-yellow-100 text-yellow-800',
  CANCELED: 'bg-danger-soft text-danger-strong',
  COMPLETED: 'bg-gray-100 text-gray-700',
};
