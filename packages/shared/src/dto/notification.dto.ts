import type { NotificationType } from "../enums/index.js";

/**
 * 알림 문구를 조립하는 데 필요한 원자 데이터 (레이어 5 §5.9).
 *
 * 완성된 문장을 저장하지 않는다 — API가 한국어 문장을 만들어 넣으면
 * 클라이언트가 번역할 수 없어 i18n 구조(레이어 6 §6.9)와 어긋난다.
 * 표시 문구는 이 값들로 웹에서 조립한다.
 *
 * 타입별로 채워지는 필드가 다르다:
 *  - SCHEDULE_CREATED  : startAt, (반복 일괄 생성이면) scheduleCount
 *  - SCHEDULE_UPDATED  : startAt, (시간이 바뀌었으면) prevStartAt
 *  - SCHEDULE_CANCELED : startAt
 */
export interface NotificationPayload {
  /** 일정의 시작 시각 (ISO8601) */
  startAt?: string;
  /** 변경 전 시작 시각. 시간이 바뀐 경우에만 채워진다 (ISO8601) */
  prevStartAt?: string;
  /** 반복 일정을 일괄 생성했을 때의 건수 */
  scheduleCount?: number;
  /**
   * @deprecated 구조화 이전(2026-09-04 이전)에 API가 만들어 저장한 한국어 문구.
   * 과거 알림을 읽을 때만 쓰이며 새로 저장하지 않는다.
   */
  message?: string;
}

export interface NotificationResponseDto {
  id: string;
  parentId: string;
  type: NotificationType;
  scheduleId: string | null;
  childId: string | null;
  /**
   * 알림이 "누구의·어디 일정"인지 알려주는 표시용 필드 (레이어 5 §5.9).
   * 저장하지 않고 조회 시점에 조인해 채우므로 과거 알림도 함께 채워진다.
   * 연결된 레코드가 사라졌거나(기관 삭제 시 SetNull) 일정이 없는 알림이면 null.
   */
  organizationName: string | null;
  therapistName: string | null;
  childName: string | null;
  payload: NotificationPayload;
  isRead: boolean;
  createdAt: string;
}
