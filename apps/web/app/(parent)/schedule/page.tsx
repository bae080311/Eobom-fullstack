import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { ScheduleStatus } from '@eobom/shared';
import { ParentTabBar } from '@/widgets/parent-tab-bar';
import { SessionRow, fetchSchedules, mapScheduleToUpcoming } from '@/entities/schedule';
import { ChildChipList, fetchChildren, mapChildToChip } from '@/entities/child';
import { fetchNotifications } from '@/entities/notification';
import { PageShell, PageTopBar, SectionHeader, IconButton, IconBell } from '@/shared/ui';
import { getKSTStartOfDay, formatDateLabel } from '@/shared/lib/date';

export const metadata: Metadata = { title: '일정' };

const SCHEDULE_RANGE_DAYS = 180;

export default async function ParentSchedulePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  const now = new Date();
  const todayStart = getKSTStartOfDay(now);
  const from = new Date(todayStart.getTime() - SCHEDULE_RANGE_DAYS * 24 * 60 * 60 * 1000);
  const to = new Date(todayStart.getTime() + SCHEDULE_RANGE_DAYS * 24 * 60 * 60 * 1000 - 1);

  const [schedules, children, notifications] = token
    ? await Promise.all([
        fetchSchedules(token, from, to),
        fetchChildren(token),
        fetchNotifications(token),
      ])
    : [[], [], []];

  const activeSchedules = [...schedules]
    .filter((s) => s.status !== ScheduleStatus.CANCELED)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const sessions = activeSchedules.map((s) => mapScheduleToUpcoming(s, now));
  const upcoming = sessions.filter((s) => s.status !== 'past');
  const past = sessions.filter((s) => s.status === 'past').reverse();

  const childChips = children.map(mapChildToChip);
  const todayLabel = formatDateLabel(todayStart.toISOString());
  const hasUnreadNotifications = notifications.some((n) => !n.isRead);

  return (
    <PageShell>
      <PageTopBar
        title="일정"
        subtitle={todayLabel}
        action={
          <Link href="/notifications" aria-label="알림" className="relative inline-flex">
            <IconButton label="알림" hasDot={hasUnreadNotifications}>
              <IconBell size={18} />
            </IconButton>
          </Link>
        }
      />

      <ChildChipList
        items={[{ id: 'all', name: '전체', age: '' }, ...childChips]}
        defaultSelectedId="all"
      />

      <section className="px-5 mt-2">
        <SectionHeader
          title="예정된 일정"
          right={<span className="text-body2 text-gray-600 font-medium">{upcoming.length}건</span>}
        />
        <div className="flex flex-col gap-2">
          {upcoming.length === 0 ? (
            <p className="text-body text-gray-400 text-center py-8">예정된 일정이 없습니다</p>
          ) : (
            upcoming.map((s) => <SessionRow key={s.id} session={s} />)
          )}
        </div>
      </section>

      <section className="px-5 mt-7">
        <SectionHeader
          title="지난 일정"
          right={<span className="text-body2 text-gray-600 font-medium">{past.length}건</span>}
        />
        <div className="flex flex-col gap-2 opacity-60">
          {past.length === 0 ? (
            <p className="text-body text-gray-400 text-center py-8">지난 일정이 없습니다</p>
          ) : (
            past.map((s) => <SessionRow key={s.id} session={s} />)
          )}
        </div>
      </section>

      <ParentTabBar active="schedule" />
    </PageShell>
  );
}
