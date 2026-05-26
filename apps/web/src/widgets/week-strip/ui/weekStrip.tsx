import { SectionHeader } from '@/shared/ui';
import type { WeekDay } from '@/entities/schedule';

function WeekDayCell({ day }: { day: WeekDay }) {
  return (
    <div className={`rounded-md py-2.5 pb-2 text-center flex flex-col items-center gap-1 relative ${day.today ? 'bg-brand' : 'bg-white'}`}>
      <span className={`text-caption font-semibold ${day.today ? 'text-white' : 'text-gray-400'}`}>
        {day.dow}
      </span>
      <span className={`text-subhead font-bold tabular-nums ${day.today ? 'text-white' : 'text-gray-900'}`}>
        {day.num}
      </span>
      <span className={`absolute bottom-1.5 w-1 h-1 rounded-full ${
        day.today ? 'bg-white' : day.hasSession ? 'bg-brand' : 'bg-gray-300'
      }`} />
    </div>
  );
}

interface Props {
  days: WeekDay[];
  rangeLabel?: string;
}

export function WeekStrip({ days, rangeLabel }: Props) {
  return (
    <section className="px-5 mt-7">
      <SectionHeader
        title="이번 주"
        right={rangeLabel && <span className="text-body2 text-gray-600 font-medium">{rangeLabel}</span>}
      />
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => <WeekDayCell key={day.dow} day={day} />)}
      </div>
    </section>
  );
}
