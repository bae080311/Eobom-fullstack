import type { Notification } from '../model/types';

interface Props {
  notification: Notification;
}

export function NotificationCard({ notification: n }: Props) {
  return (
    <div
      className={`border rounded-md p-[14px_16px] grid grid-cols-[1fr_auto] items-start gap-2.5 ${
        n.unread ? 'bg-brand-softer border-brand-soft' : 'bg-white border-gray-200'
      }`}
    >
      <div>
        <div className="text-body font-bold text-gray-900 leading-snug tracking-tight flex items-center gap-1.5">
          {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
          {n.title}
        </div>
        <div className="text-label text-gray-600 mt-1 leading-[1.45]">{n.sub}</div>
      </div>
      <div className="text-caption text-gray-400 font-medium">{n.time}</div>
    </div>
  );
}
