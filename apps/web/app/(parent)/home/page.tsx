import type { Metadata } from 'next';
import Link from 'next/link';
import { NextSessionHero } from '@/widgets/next-session-hero';
import { WeekStrip } from '@/widgets/week-strip';
import { ParentTabBar } from '@/widgets/parent-tab-bar';
import { SessionRow, MOCK_NEXT_SESSION, MOCK_UPCOMING, MOCK_WEEK } from '@/entities/schedule';
import { NotificationCard, MOCK_PARENT_NOTIFICATIONS } from '@/entities/notification';
import { ChildChipList, MOCK_CHILDREN } from '@/entities/child';
import { PageShell, PageTopBar, SectionHeader, IconButton, IconBell } from '@/shared/ui';

export const metadata: Metadata = { title: '홈' };

export default function ParentHomePage() {
  return (
    <PageShell>
      <PageTopBar
        title="안녕하세요, 민서희님"
        subtitle="5월 22일 목요일"
        action={
          <Link href="/notifications" aria-label="알림" className="relative inline-flex">
            <IconButton label="알림" hasDot>
              <IconBell size={18} />
            </IconButton>
          </Link>
        }
      />

      <ChildChipList children={MOCK_CHILDREN} defaultSelectedId="c1" />

      <NextSessionHero session={MOCK_NEXT_SESSION} />

      <WeekStrip days={MOCK_WEEK} rangeLabel="5월 19일 – 25일" />

      <section className="px-5 mt-7">
        <SectionHeader
          title="다음 일정"
          right={
            <Link href="/schedule" className="text-body2 text-gray-600 font-semibold no-underline">
              전체 보기
            </Link>
          }
        />
        <div className="flex flex-col gap-2">
          {MOCK_UPCOMING.filter((s) => s.status !== 'past').slice(0, 3).map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </div>
      </section>

      <section className="px-5 mt-7">
        <SectionHeader
          title="최근 알림"
          right={
            <Link href="/notifications" className="text-body2 text-gray-600 font-semibold no-underline">
              전체
            </Link>
          }
        />
        <div className="flex flex-col gap-2">
          {MOCK_PARENT_NOTIFICATIONS.map((n) => (
            <NotificationCard key={n.id} notification={n} />
          ))}
        </div>
      </section>

      <ParentTabBar active="home" />
    </PageShell>
  );
}
