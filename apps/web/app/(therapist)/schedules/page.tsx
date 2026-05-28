import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { PageShell, PageTopBar } from '@/shared/ui';
import { fetchSchedules } from '@/entities/schedule';
import { ScheduleCalendarView } from '@/widgets/schedule-calendar';
import { getKSTStartOfDay } from '@/shared/lib/date';

export const metadata: Metadata = { title: '일정' };

export default async function TherapistSchedulesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  // 서버(UTC) 환경에서도 KST 기준 이번 달 1일 ~ 다음 달 말일로 조회
  const kstParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date());
  const kstYear = Number(kstParts.find((p) => p.type === 'year')!.value);
  const kstMonth = Number(kstParts.find((p) => p.type === 'month')!.value) - 1; // 0-indexed

  // day=1, hour=3 → UTC 03:00 = KST 12:00 → 해당 달 1일에 안전하게 속함
  const from = getKSTStartOfDay(new Date(Date.UTC(kstYear, kstMonth, 1, 3)));
  const to = new Date(
    getKSTStartOfDay(new Date(Date.UTC(kstYear, kstMonth + 2, 1, 3))).getTime() - 1,
  );

  const schedules = token ? await fetchSchedules(token, from, to) : [];

  return (
    <PageShell noPb>
      <PageTopBar title="일정" action={null} />
      <ScheduleCalendarView initialData={schedules} />
    </PageShell>
  );
}
