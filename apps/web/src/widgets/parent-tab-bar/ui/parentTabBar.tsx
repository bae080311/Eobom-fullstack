import Link from 'next/link';
import { IconHome, IconCalendar, IconFileText, IconUser } from '@/shared/ui';

type ActiveTab = 'home' | 'schedule' | 'notes' | 'me';

interface Props {
  active: ActiveTab;
}

export function ParentTabBar({ active }: Props) {
  const cls = (tab: ActiveTab) =>
    `flex flex-col items-center gap-1 text-caption font-semibold no-underline transition-colors ${
      active === tab ? 'text-brand' : 'text-gray-400'
    }`;

  const btnCls = (tab: ActiveTab) =>
    `flex flex-col items-center gap-1 text-caption font-semibold bg-transparent border-0 cursor-pointer font-sans transition-colors ${
      active === tab ? 'text-brand' : 'text-gray-400'
    }`;

  return (
    <nav className="fixed bottom-0 inset-x-0 h-[84px] bg-white/90 backdrop-blur-xl border-t border-gray-200 grid grid-cols-4 pt-2 pb-[30px] z-50">
      <Link href="/home" className={cls('home')} aria-label="홈">
        <IconHome size={22} /> 홈
      </Link>
      <Link href="/schedule" className={cls('schedule')} aria-label="일정">
        <IconCalendar size={22} /> 일정
      </Link>
      <button className={btnCls('notes')} aria-label="수업노트">
        <IconFileText size={22} /> 수업노트
      </button>
      <button className={btnCls('me')} aria-label="내 정보">
        <IconUser size={22} /> 내 정보
      </button>
    </nav>
  );
}
