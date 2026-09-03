import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { ScheduleStatus } from '@eobom/shared';
import { ParentTabBar } from '@/widgets/parent-tab-bar';
import { SessionRow, fetchSchedules, mapScheduleToUpcoming } from '@/entities/schedule';
import { ChildChipList, fetchChildren, mapChildToChip } from '@/entities/child';
import { fetchNotifications } from '@/entities/notification';
import { PageShell, PageTopBar, SectionHeader, IconButton, IconBell } from '@/shared/ui';
import { getKSTStartOfDay, formatDateLabel } from '@/shared/lib/date';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app.parent');
  return { title: t('scheduleTitle') };
}

const SCHEDULE_RANGE_DAYS = 180;

export default async function ParentSchedulePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  const now = new Date();
  const todayStart = getKSTStartOfDay(now);
  const from = new Date(todayStart.getTime() - SCHEDULE_RANGE_DAYS * 24 * 60 * 60 * 1000);
  const to = new Date(todayStart.getTime() + SCHEDULE_RANGE_DAYS * 24 * 60 * 60 * 1000 - 1);

  const [[schedules, children, notifications], tApp, tAppCommon, tSchedule] = await Promise.all([
    token
      ? Promise.all([
          fetchSchedules(token, from, to),
          fetchChildren(token),
          fetchNotifications(token),
        ])
      : Promise.resolve([[], [], []]),
    getTranslations('app.parent'),
    getTranslations('app.common'),
    getTranslations('entities.schedule'),
  ]);

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
        title={tApp('scheduleTitle')}
        subtitle={todayLabel}
        action={
          <Link
            href="/notifications"
            aria-label={tAppCommon('notificationsAriaLabel')}
            className="relative inline-flex"
          >
            <IconButton
              label={tAppCommon('notificationsAriaLabel')}
              hasDot={hasUnreadNotifications}
            >
              <IconBell size={18} />
            </IconButton>
          </Link>
        }
      />

      <ChildChipList
        items={[{ id: 'all', name: tApp('allChildrenChip'), age: '' }, ...childChips]}
        defaultSelectedId="all"
      />

      <section className="px-5 mt-2">
        <SectionHeader
          title={tApp('upcomingSection')}
          right={
            <span className="text-body2 text-gray-600 font-medium">
              {tApp('countUnit', { count: upcoming.length })}
            </span>
          }
        />
        <div className="flex flex-col gap-2">
          {upcoming.length === 0 ? (
            <p className="text-body text-gray-600 text-center py-8">{tApp('noUpcoming')}</p>
          ) : (
            upcoming.map((s) => (
              <SessionRow key={s.id} session={s} todayLabel={tSchedule('today')} />
            ))
          )}
        </div>
      </section>

      <section className="px-5 mt-7">
        <SectionHeader
          title={tApp('pastSection')}
          right={
            <span className="text-body2 text-gray-600 font-medium">
              {tApp('countUnit', { count: past.length })}
            </span>
          }
        />
        <div className="flex flex-col gap-2 opacity-60">
          {past.length === 0 ? (
            <p className="text-body text-gray-600 text-center py-8">{tApp('noPastSchedule')}</p>
          ) : (
            past.map((s) => <SessionRow key={s.id} session={s} todayLabel={tSchedule('today')} />)
          )}
        </div>
      </section>

      <ParentTabBar active="schedule" />
    </PageShell>
  );
}
