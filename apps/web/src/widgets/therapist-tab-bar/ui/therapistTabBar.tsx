import Link from 'next/link';
import { IconHome, IconCalendar, IconUser } from '@/shared/ui';

type ActiveTab = 'home' | 'schedules' | 'me';

interface Props {
  active: ActiveTab;
}

export function TherapistTabBar({ active }: Props) {
  const cls = (tab: ActiveTab) =>
    `flex flex-col items-center gap-1 text-caption font-semibold no-underline transition-colors ${
      active === tab ? 'text-brand' : 'text-gray-400'
    }`;

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 grid grid-cols-3 pt-2 pb-2 safe-area-inset-bottom z-50">
      <Link href="/dashboard" className={cls('home')} aria-label="홈">
        <IconHome size={22} /> 홈
      </Link>
      <Link href="/schedules" className={cls('schedules')} aria-label="일정">
        <IconCalendar size={22} /> 일정
      </Link>
      <Link href="/me" className={cls('me')} aria-label="내 정보">
        <IconUser size={22} /> 내 정보
      </Link>
    </nav>
  );
}
