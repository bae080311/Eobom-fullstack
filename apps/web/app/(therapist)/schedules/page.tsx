import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { PageShell, PageTopBar } from '@/shared/ui';
import { fetchSchedules } from '@/entities/schedule';
import { ScheduleCalendarView } from '@/widgets/schedule-calendar';
import { TherapistTabBar } from '@/widgets/therapist-tab-bar';
import { getKSTStartOfDay } from '@/shared/lib/date';

export const metadata: Metadata = { title: '일정' };

export default async function TherapistSchedulesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  const kstParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date());
  const kstYear = Number(kstParts.find((p) => p.type === 'year')!.value);
  const kstMonth = Number(kstParts.find((p) => p.type === 'month')!.value) - 1; // 0-indexed

  const from = getKSTStartOfDay(new Date(Date.UTC(kstYear, kstMonth, 1, 3)));
  const to = new Date(
    getKSTStartOfDay(new Date(Date.UTC(kstYear, kstMonth + 2, 1, 3))).getTime() - 1,
  );

  const schedules = token ? await fetchSchedules(token, from, to) : [];

  return (
    <PageShell noPb>
      <PageTopBar title="일정" action={null} />
      <ScheduleCalendarView initialData={schedules} />
      <TherapistTabBar active="schedules" />
    </PageShell>
  );
}
