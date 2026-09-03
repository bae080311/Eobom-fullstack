'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ScheduleResponseDto } from '@eobom/shared';
import { ScheduleCard } from '@/entities/schedule';
import { useTodaySchedules, useWeekSchedules } from '@/entities/schedule';
import type { UserWithProfile } from '@/entities/user';
import { SectionHeader } from '@/shared/ui';
import { toKSTDateString } from '@/shared/lib/date';

interface Props {
  todayInitialData: ScheduleResponseDto[];
  weekInitialData: ScheduleResponseDto[];
  userProfile: UserWithProfile | null;
  todayLabel: string;
  weekStart: string;
}

function buildWeekDots(
  weekStart: Date,
  schedules: ScheduleResponseDto[],
  dowLabels: readonly string[],
) {
  const scheduleDates = new Set(schedules.map((s) => toKSTDateString(s.startAt)));
  return dowLabels.map((dow, i) => {
    const day = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = toKSTDateString(day);
    return { dow, dateStr, hasSession: scheduleDates.has(dateStr) };
  });
}

export function TherapistDashboard({
  todayInitialData,
  weekInitialData,
  userProfile,
  todayLabel,
  weekStart,
}: Props) {
  const t = useTranslations('widgets.therapistDashboard');
  const tSchedule = useTranslations('entities.schedule');
  const { data: todaySchedules = [] } = useTodaySchedules(todayInitialData);
  const { data: weekSchedules = [] } = useWeekSchedules(weekInitialData);

  const weekStartParsed = new Date(weekStart);
  const weekDots = buildWeekDots(weekStartParsed, weekSchedules, tSchedule.raw('dow'));

  return (
    <div className="pb-24">
      <section className="px-5 mt-4">
        <span className="inline-flex items-center text-label font-semibold text-brand bg-brand-soft px-2.5 py-1 rounded-full">
          {todayLabel}
        </span>
        <p className="text-title3 font-bold text-gray-900 mt-2.5">
          {t('greeting')} <span className="text-brand">{userProfile?.name ?? '—'}</span>{' '}
          {t('greetingSuffix')}
        </p>
        <p className="text-body text-gray-600 mt-0.5">{t('noOrg')}</p>
      </section>

      <section className="px-5 mt-6">
        <SectionHeader
          title={t('todayScheduleCount', { count: todaySchedules.length })}
          right={null}
        />
        {todaySchedules.length === 0 ? (
          <p className="text-body text-gray-600 text-center py-10">{t('noTodaySchedule')}</p>
        ) : (
          <div className="flex flex-col gap-3 mt-3">
            {todaySchedules.map((s) => (
              <ScheduleCard key={s.id} schedule={s} />
            ))}
          </div>
        )}
      </section>

      <section className="px-5 mt-8">
        <SectionHeader
          title={t('weekScheduleCount', { count: weekSchedules.length })}
          right={
            <Link href="/schedules" className="text-body2 text-gray-600 font-semibold no-underline">
              {t('viewAll')}
            </Link>
          }
        />
        <div className="mt-3 flex justify-between">
          {weekDots.map(({ dow, dateStr, hasSession }) => (
            <div key={dateStr} className="flex flex-col items-center gap-1.5">
              <span className="text-caption text-gray-600">{dow}</span>
              <span className={`w-2 h-2 rounded-full ${hasSession ? 'bg-brand' : 'bg-gray-200'}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
