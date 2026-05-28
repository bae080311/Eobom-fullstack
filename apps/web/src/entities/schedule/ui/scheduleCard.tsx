import type { ScheduleResponseDto } from '@eobom/shared';
import { formatTime } from '@/shared/lib/date';
import { SCHEDULE_STATUS_LABEL, SCHEDULE_STATUS_COLOR } from '../model/status';

export function ScheduleCard({ schedule }: { schedule: ScheduleResponseDto }) {
  const startTime = formatTime(schedule.startAt);
  const endTime = formatTime(schedule.endAt);

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-body font-bold text-gray-900">
          {schedule.childName} · {schedule.title}
        </span>
        <span
          className={`text-caption2 font-bold px-2 py-0.5 rounded-full ${SCHEDULE_STATUS_COLOR[schedule.status]}`}
        >
          {SCHEDULE_STATUS_LABEL[schedule.status]}
        </span>
      </div>
      <span className="text-label text-gray-500">
        {startTime} – {endTime}
      </span>
      {schedule.notes && (
        <span className="text-label text-gray-400 truncate">{schedule.notes}</span>
      )}
    </div>
  );
}
