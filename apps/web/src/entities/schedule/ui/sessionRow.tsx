import Link from 'next/link';
import { IconChevronRight, TimeRail } from '@/shared/ui';
import type { UpcomingSession } from '../model/types';

interface Props {
  session: UpcomingSession;
  // 서버 컴포넌트에서 getTranslations()를 직접 호출하면 async 컴포넌트가 되어
  // 기존 RTL render() 테스트와 충돌하므로, 번역된 라벨을 상위(페이지)에서 prop으로 받는다.
  todayLabel: string;
}

/**
 * 다음 일정 한 줄.
 *
 * 흰 카드에 3열 그리드로 따로 그리던 것을 `TimeRail` 로 옮겼다. 같은 "언제·무엇"을
 * 화면마다 다른 문법으로 그리면 시간 축이 축 구실을 못 한다. 날짜는 남긴다 —
 * 이번 주를 벗어난 일정도 여기 들어오므로 요일만으로는 부족하다.
 */
export function SessionRow({ session: s, todayLabel }: Props) {
  return (
    <Link href={`/schedule/${s.id}`} className="block no-underline">
      <TimeRail
        dow={`${s.day} ${s.date}`}
        time={s.time}
        title={`${s.child} · ${s.type}`}
        subtitle={s.therapist}
        muted={s.status === 'past'}
        trailing={
          <span className="flex items-center gap-2">
            {s.status === 'today' && (
              <span className="text-caption2 font-bold bg-brand-soft text-brand-ink rounded-full px-2 py-0.5">
                {todayLabel}
              </span>
            )}
            <span className="text-gray-300">
              <IconChevronRight size={16} />
            </span>
          </span>
        }
      />
    </Link>
  );
}
