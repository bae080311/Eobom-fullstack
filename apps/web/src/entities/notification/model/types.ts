export type NotificationVariant = 'confirm' | 'reschedule' | 'cancel' | 'new' | 'note';
export type NotificationGroup = '오늘' | '어제' | '이전';

export interface Notification {
  id: string;
  type: NotificationVariant;
  title: string;
  sub: string;
  time: string;
  unread: boolean;
  group: NotificationGroup;
}
