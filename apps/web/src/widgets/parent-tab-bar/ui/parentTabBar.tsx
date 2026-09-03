'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { IconHome, IconCalendar, IconFileText, IconUser } from '@/shared/ui';

type ActiveTab = 'home' | 'schedule' | 'notes' | 'me';

interface Props {
  active: ActiveTab;
}

export function ParentTabBar({ active }: Props) {
  const t = useTranslations('widgets.parentTabBar');

  const cls = (tab: ActiveTab) =>
    `flex flex-col items-center gap-1 text-caption font-semibold no-underline transition-colors ${
      active === tab ? 'text-brand' : 'text-gray-600'
    }`;

  const btnCls = (tab: ActiveTab) =>
    `flex flex-col items-center gap-1 text-caption font-semibold bg-transparent border-0 cursor-pointer font-sans transition-colors ${
      active === tab ? 'text-brand' : 'text-gray-600'
    }`;

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 grid grid-cols-4 pt-2 pb-2 safe-area-inset-bottom z-50">
      <Link href="/home" className={cls('home')} aria-label={t('home')}>
        <IconHome size={22} /> {t('home')}
      </Link>
      <Link href="/schedule" className={cls('schedule')} aria-label={t('schedule')}>
        <IconCalendar size={22} /> {t('schedule')}
      </Link>
      <button className={btnCls('notes')} aria-label={t('notes')}>
        <IconFileText size={22} /> {t('notes')}
      </button>
      <Link href="/me" className={cls('me')} aria-label={t('me')}>
        <IconUser size={22} /> {t('me')}
      </Link>
    </nav>
  );
}
