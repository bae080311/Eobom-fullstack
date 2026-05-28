import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { PageShell, PageTopBar, SectionHeader } from '@/shared/ui';
import { formatDateLabel } from '@/shared/lib/date';
import { ScheduleCard, fetchSchedules } from '@/entities/schedule';

export const metadata: Metadata = { title: '일정' };

export default async function TherapistSchedulesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  const schedules = token ? await fetchSchedules(token) : [];

  const todayStr = new Date().toDateString();
  const today = schedules.filter((s) => new Date(s.startAt).toDateString() === todayStr);
  const upcoming = schedules.filter((s) => new Date(s.startAt).toDateString() !== todayStr);

  const todayLabel = formatDateLabel(new Date().toISOString());

  return (
    <PageShell>
      <PageTopBar title="일정" subtitle={todayLabel} action={null} />

      <section className="px-5 mt-2">
        <SectionHeader
          title="오늘"
          right={<span className="text-body2 text-gray-600 font-medium">{today.length}건</span>}
        />
        {today.length === 0 ? (
          <p className="text-body2 text-gray-400 py-3">오늘 예정된 일정이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {today.map((s) => (
              <ScheduleCard key={s.id} schedule={s} />
            ))}
          </div>
        )}
      </section>

      <section className="px-5 mt-7 pb-24">
        <SectionHeader
          title="이후 30일"
          right={<span className="text-body2 text-gray-600 font-medium">{upcoming.length}건</span>}
        />
        {upcoming.length === 0 ? (
          <p className="text-body2 text-gray-400 py-3">예정된 일정이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {upcoming.map((s) => (
              <div key={s.id}>
                <p className="text-label text-gray-400 font-semibold mb-1.5">
                  {formatDateLabel(s.startAt)}
                </p>
                <ScheduleCard schedule={s} />
              </div>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
