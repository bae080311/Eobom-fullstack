import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { ScheduleStatus } from '@eobom/shared';
import { NextSessionHero } from '@/widgets/next-session-hero';
import { WeekStrip } from '@/widgets/week-strip';
import { ParentTabBar } from '@/widgets/parent-tab-bar';
import {
  SessionRow,
  fetchSchedules,
  mapScheduleToUpcoming,
  mapScheduleToNextSession,
  buildWeekDays,
} from '@/entities/schedule';
import {
  NotificationCard,
  fetchNotifications,
  mapDtoToNotification,
} from '@/entities/notification';
import { ChildChipList, fetchChildren, mapChildToChip } from '@/entities/child';
import { fetchUserMe } from '@/entities/user';
import { PageShell, PageTopBar, SectionHeader, IconLink, IconBell } from '@/shared/ui';
import {
  getKSTStartOfDay,
  getKSTWeekStart,
  formatDateLabel,
  toKSTDateString,
} from '@/shared/lib/date';

export const metadata: Metadata = { title: '홈' };

const HOME_RANGE_DAYS = 30;
const NOTIFICATION_LIMIT = 3;
const UPCOMING_LIMIT = 3;

function formatWeekRangeLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  const [, startMonth, startDay] = toKSTDateString(weekStart).split('-');
  const [, endMonth, endDay] = toKSTDateString(weekEnd).split('-');
  const start = `${parseInt(startMonth, 10)}월 ${parseInt(startDay, 10)}일`;
  const end =
    startMonth === endMonth
      ? `${parseInt(endDay, 10)}일`
      : `${parseInt(endMonth, 10)}월 ${parseInt(endDay, 10)}일`;
  return `${start} – ${end}`;
}

export default async function ParentHomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  const now = new Date();
  const todayStart = getKSTStartOfDay(now);
  const rangeFrom = todayStart;
  const rangeTo = new Date(todayStart.getTime() + HOME_RANGE_DAYS * 24 * 60 * 60 * 1000 - 1);
  const weekStart = getKSTWeekStart(now);

  const [schedules, children, userProfile, notifications] = token
    ? await Promise.all([
        fetchSchedules(token, rangeFrom, rangeTo),
        fetchChildren(token),
        fetchUserMe(token),
        fetchNotifications(token),
      ])
    : [[], [], null, []];

  const activeSchedules = schedules
    .filter((s) => s.status !== ScheduleStatus.CANCELED)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const nextSessionDto = activeSchedules[0];
  const nextSession = nextSessionDto ? mapScheduleToNextSession(nextSessionDto, now) : null;

  const weekDays = buildWeekDays(weekStart, activeSchedules, now);
  const upcoming = activeSchedules
    .slice(0, UPCOMING_LIMIT)
    .map((s) => mapScheduleToUpcoming(s, now));
  const childChips = children.map(mapChildToChip);
  const notificationItems = notifications.slice(0, NOTIFICATION_LIMIT).map(mapDtoToNotification);

  const todayLabel = formatDateLabel(todayStart.toISOString());

  return (
    <PageShell>
      <PageTopBar
        title={`안녕하세요, ${userProfile?.name ?? ''}님`}
        subtitle={todayLabel}
        action={
          <IconLink label="알림" hasDot href="/notifications">
            <IconBell size={18} />
          </IconLink>
        }
      />

      <ChildChipList items={childChips} defaultSelectedId={childChips[0]?.id} />

      {nextSession && <NextSessionHero session={nextSession} />}

      <WeekStrip days={weekDays} rangeLabel={formatWeekRangeLabel(weekStart)} />

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
          {upcoming.length === 0 ? (
            <p className="text-body text-gray-400 text-center py-8">예정된 일정이 없습니다</p>
          ) : (
            upcoming.map((s) => <SessionRow key={s.id} session={s} />)
          )}
        </div>
      </section>

      <section className="px-5 mt-7">
        <SectionHeader
          title="최근 알림"
          right={
            <Link
              href="/notifications"
              className="text-body2 text-gray-600 font-semibold no-underline"
            >
              전체
            </Link>
          }
        />
        <div className="flex flex-col gap-2">
          {notificationItems.length === 0 ? (
            <p className="text-body text-gray-400 text-center py-8">새로운 알림이 없어요</p>
          ) : (
            notificationItems.map((n) => <NotificationCard key={n.id} notification={n} />)
          )}
        </div>
      </section>

      <ParentTabBar active="home" />
    </PageShell>
  );
}
