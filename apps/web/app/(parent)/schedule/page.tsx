import type { Metadata } from 'next';
import Link from 'next/link';
import { ParentTabBar } from '@/widgets/parent-tab-bar';
import { SessionRow, MOCK_UPCOMING } from '@/entities/schedule';
import { ChildChipList, MOCK_CHILDREN } from '@/entities/child';
import { PageShell, PageTopBar, SectionHeader, IconButton, IconBell } from '@/shared/ui';

export const metadata: Metadata = { title: '일정' };

export default function ParentSchedulePage() {
  const upcoming = MOCK_UPCOMING.filter((s) => s.status !== 'past');
  const past = MOCK_UPCOMING.filter((s) => s.status === 'past');

  return (
    <PageShell>
      <PageTopBar
        title="일정"
        subtitle="5월 22일 목요일"
        action={
          <Link href="/notifications" aria-label="알림" className="relative inline-flex">
            <IconButton label="알림" hasDot>
              <IconBell size={18} />
            </IconButton>
          </Link>
        }
      />

      <ChildChipList
        items={[{ id: 'all', name: '전체', age: '' }, ...MOCK_CHILDREN]}
        defaultSelectedId="all"
      />

      <section className="px-5 mt-2">
        <SectionHeader
          title="예정된 일정"
          right={<span className="text-body2 text-gray-600 font-medium">{upcoming.length}건</span>}
        />
        <div className="flex flex-col gap-2">
          {upcoming.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </div>
      </section>

      <section className="px-5 mt-7">
        <SectionHeader
          title="지난 일정"
          right={<span className="text-body2 text-gray-600 font-medium">{past.length}건</span>}
        />
        <div className="flex flex-col gap-2 opacity-60">
          {past.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </div>
      </section>

      <ParentTabBar active="schedule" />
    </PageShell>
  );
}
