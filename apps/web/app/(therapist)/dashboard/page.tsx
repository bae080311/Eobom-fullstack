import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { PageShell, PageTopBar, IconLink, IconBell } from '@/shared/ui';
import { fetchSchedules } from '@/entities/schedule';
import { fetchUserMe } from '@/entities/user';
import { TherapistDashboard } from '@/widgets/therapist-dashboard';
import { TherapistTabBar } from '@/widgets/therapist-tab-bar';
import { getKSTStartOfDay, getKSTWeekStart, formatDateLabel } from '@/shared/lib/date';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app.therapist');
  return { title: t('dashboardTitle') };
}

export default async function TherapistDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  const tAppCommon = await getTranslations('app.common');

  const todayFrom = getKSTStartOfDay();
  const todayTo = new Date(todayFrom.getTime() + 24 * 60 * 60 * 1000 - 1);
  const weekFrom = getKSTWeekStart();
  const weekTo = new Date(weekFrom.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

  const [todaySchedules, weekSchedules, userProfile] = token
    ? await Promise.all([
        fetchSchedules(token, todayFrom, todayTo),
        fetchSchedules(token, weekFrom, weekTo),
        fetchUserMe(token),
      ])
    : [[], [], null];

  const todayLabel = formatDateLabel(todayFrom.toISOString());

  return (
    <PageShell>
      <PageTopBar
        action={
          <IconLink label={tAppCommon('notificationsAriaLabel')} href="/notifications">
            <IconBell size={14} />
          </IconLink>
        }
      />
      <TherapistDashboard
        todayInitialData={todaySchedules}
        weekInitialData={weekSchedules}
        userProfile={userProfile}
        todayLabel={todayLabel}
        weekStart={weekFrom.toISOString()}
      />
      <TherapistTabBar active="home" />
    </PageShell>
  );
}
