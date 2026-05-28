import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { PageShell, PageTopBar } from '@/shared/ui';
import { fetchSchedules } from '@/entities/schedule';
import { ScheduleCalendarView } from '@/widgets/schedule-calendar';

export const metadata: Metadata = { title: '일정' };

export default async function TherapistSchedulesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);

  const schedules = token ? await fetchSchedules(token, from, to) : [];

  return (
    <PageShell noPb>
      <PageTopBar title="일정" action={null} />
      <ScheduleCalendarView initialData={schedules} />
    </PageShell>
  );
}
