export type NotificationVariant = 'confirm' | 'reschedule' | 'cancel' | 'new' | 'note';
// 표시 라벨(오늘/어제/이전)은 컴포넌트에서 t(`group.${group}`)로 번역한다.
export type NotificationGroup = 'today' | 'yesterday' | 'earlier';

export interface Notification {
  id: string;
  type: NotificationVariant;
  title: string;
  sub: string;
  time: string;
  unread: boolean;
  group: NotificationGroup;
}
