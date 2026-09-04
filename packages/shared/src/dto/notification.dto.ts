import type { NotificationType } from "../enums/index.js";

export interface NotificationPayload {
  message: string;
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
