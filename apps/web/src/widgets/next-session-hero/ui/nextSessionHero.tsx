import { IconClock, IconUser, IconMapPin, IconCheck, IconRefresh } from '@/shared/ui';
import type { NextSession } from '@/entities/schedule';

interface Props {
  session: NextSession;
}

export function NextSessionHero({ session: s }: Props) {
  return (
    <div className="relative bg-brand text-white rounded-[22px] p-[22px] mx-5 overflow-hidden
      before:absolute before:content-[''] before:-right-[50px] before:-top-[50px] before:w-[180px] before:h-[180px] before:border before:border-white/20 before:rounded-full before:pointer-events-none
      after:absolute after:content-[''] after:right-[50px] after:top-4 after:w-20 after:h-20 after:border after:border-white/20 after:rounded-full after:pointer-events-none">

      <span className="inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-1.5 rounded-full text-label font-bold">
        <IconClock size={12} /> {s.timeUntil}
      </span>

      <div className="mt-[14px] text-body font-semibold text-white/80 tracking-tight">
        {s.dateLabel}
      </div>
      <div className="text-hero font-extrabold tracking-tighter tabular-nums leading-tight mt-0.5">
        {s.timeLabel}
      </div>
      <div className="mt-1.5 text-callout font-semibold">
        {s.childName}의 {s.type}
      </div>

      <div className="mt-[14px] pt-[14px] border-t border-white/20 text-body2 text-white/80 flex flex-col gap-1.5 relative z-10">
        <span className="flex items-center gap-2">
          <IconUser size={14} /> {s.therapistName}
        </span>
        <span className="flex items-center gap-2">
          <IconMapPin size={14} /> {s.location}
        </span>
      </div>

      <div className="flex gap-2 mt-[18px] relative z-10">
        <button className="flex-1 bg-white text-brand-ink rounded-[10px] py-3 px-[14px] font-bold text-body inline-flex items-center justify-center gap-1.5 border-0 cursor-pointer">
          <IconCheck size={16} /> 확인
        </button>
        <button className="flex-1 bg-white/20 text-white rounded-[10px] py-3 px-[14px] font-bold text-body inline-flex items-center justify-center gap-1.5 border-0 cursor-pointer">
          <IconRefresh size={16} /> 변경 요청
        </button>
      </div>
    </div>
  );
}
