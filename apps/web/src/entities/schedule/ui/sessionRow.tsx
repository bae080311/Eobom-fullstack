import Link from 'next/link';
import { IconClock, IconChevronRight } from '@/shared/ui';
import type { UpcomingSession } from '../model/types';

interface Props {
  session: UpcomingSession;
  // 서버 컴포넌트에서 getTranslations()를 직접 호출하면 async 컴포넌트가 되어
  // 기존 RTL render() 테스트와 충돌하므로, 번역된 라벨을 상위(페이지)에서 prop으로 받는다.
  todayLabel: string;
}

export function SessionRow({ session: s, todayLabel }: Props) {
  return (
    <Link href={`/schedule/${s.id}`} className="no-underline">
      <div className="bg-white border border-gray-200 rounded-md p-3 grid grid-cols-[56px_1fr_auto] gap-3 items-center">
        <div className="text-callout font-bold tracking-tight text-gray-600 tabular-nums">
          <span className="text-caption text-gray-600 font-semibold block">{s.day}</span>
          {s.date}일
        </div>
        <div>
          <div className="text-body font-bold tracking-tight text-gray-900 flex items-center gap-1.5">
            {s.status === 'today' && (
              <span className="text-caption2 font-bold bg-brand text-white rounded-full px-1.5 py-0.5">
                {todayLabel}
              </span>
            )}
            {s.child} · {s.type}
          </div>
          <div className="text-label text-gray-600 mt-0.5 flex items-center gap-1">
            <IconClock size={11} /> {s.time} · {s.therapist}
          </div>
        </div>
        <span className="text-gray-300">
          <IconChevronRight size={16} />
        </span>
      </div>
    </Link>
  );
}
