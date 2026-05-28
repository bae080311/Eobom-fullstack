'use client';

import type { ScheduleResponseDto } from '@eobom/shared';
import { formatTime } from '@/shared/lib/date';
import { SCHEDULE_STATUS_LABEL, SCHEDULE_STATUS_COLOR } from '../model/status';

const STATUS_BAR: Record<string, string> = {
  SCHEDULED: 'bg-brand',
  RESCHEDULED: 'bg-yellow-400',
  CANCELED: 'bg-danger',
  COMPLETED: 'bg-gray-300',
};

interface Props {
  schedule: ScheduleResponseDto;
  onClick?: () => void;
}

export function ScheduleCard({ schedule, onClick }: Props) {
  const start = formatTime(schedule.startAt);
  const end = formatTime(schedule.endAt);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left relative flex bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm active:scale-[0.99] transition-transform"
    >
      <div className={`w-[3px] flex-shrink-0 ${STATUS_BAR[schedule.status] ?? 'bg-gray-300'}`} />

      <div className="flex flex-1 items-center gap-3 px-4 py-3.5">
        {/* 시간 블록 */}
        <div className="flex flex-col items-end min-w-[40px] shrink-0 gap-0.5">
          <span className="text-callout font-bold text-brand tabular-nums">{start}</span>
          <span className="text-label font-medium text-gray-400 tabular-nums">{end}</span>
        </div>

        <div className="w-px self-stretch bg-gray-100 shrink-0" />

        {/* 본문 */}
        <div className="flex flex-col flex-1 gap-0.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-body font-semibold text-gray-900 truncate">
              {schedule.childName}
            </span>
            <span
              className={`shrink-0 text-caption2 font-bold px-2 py-0.5 rounded-pill ${SCHEDULE_STATUS_COLOR[schedule.status]}`}
            >
              {SCHEDULE_STATUS_LABEL[schedule.status]}
            </span>
          </div>
          <span className="text-label text-gray-500 truncate">{schedule.title}</span>
          {schedule.notes && (
            <span className="text-label text-gray-400 truncate mt-0.5 italic">
              {schedule.notes}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
