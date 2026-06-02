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
  payload: NotificationPayload;
  isRead: boolean;
  createdAt: string;
}
