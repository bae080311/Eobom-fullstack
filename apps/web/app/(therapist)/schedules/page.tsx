import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { PageShell, PageTopBar } from '@/shared/ui';
import { fetchSchedules } from '@/entities/schedule';
import { ScheduleCalendarView } from '@/widgets/schedule-calendar';
import { TherapistTabBar } from '@/widgets/therapist-tab-bar';
import { CreateScheduleButton } from '@/features/create-schedule';
import { getCurrentKSTMonthRange } from '@/shared/lib/date';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app.therapist');
  return { title: t('scheduleTitle') };
}

export default async function TherapistSchedulesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  const t = await getTranslations('app.therapist');

  const { from, to } = getCurrentKSTMonthRange();

  const schedules = token ? await fetchSchedules(token, from, to) : [];

  return (
    <PageShell noPb>
      <PageTopBar title={t('scheduleTitle')} action={<CreateScheduleButton />} />
      <ScheduleCalendarView initialData={schedules} />
      <TherapistTabBar active="schedules" />
    </PageShell>
  );
}
