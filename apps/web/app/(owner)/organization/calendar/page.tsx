import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { PageShell, PageTopBar, IconLink, IconArrowLeft } from '@/shared/ui';
import { fetchSchedules } from '@/entities/schedule';
import { ScheduleCalendarView } from '@/widgets/schedule-calendar';
import { getCurrentKSTMonthRange } from '@/shared/lib/date';

export const metadata: Metadata = { title: '기관 캘린더' };

export default async function OrganizationCalendarPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  const { from, to } = getCurrentKSTMonthRange();

  const schedules = token ? await fetchSchedules(token, from, to) : [];

  return (
    <PageShell noPb>
      <PageTopBar
        title="기관 캘린더"
        back={
          <IconLink label="기관 관리로" href="/organization">
            <IconArrowLeft size={18} />
          </IconLink>
        }
      />
      <ScheduleCalendarView initialData={schedules} />
    </PageShell>
  );
}
