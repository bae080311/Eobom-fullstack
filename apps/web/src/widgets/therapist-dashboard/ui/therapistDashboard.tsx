'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ScheduleStatus } from '@eobom/shared';
import type { ScheduleResponseDto } from '@eobom/shared';
import { useTodaySchedules, useWeekSchedules } from '@/entities/schedule';
import type { UserWithProfile } from '@/entities/user';
import { SectionHeader, TimeRail, WeekRibbon } from '@/shared/ui';
import { formatTime, toKSTDateString } from '@/shared/lib/date';

interface Props {
  todayInitialData: ScheduleResponseDto[];
  weekInitialData: ScheduleResponseDto[];
  userProfile: UserWithProfile | null;
  /** 소속 기관명. 없으면 `noOrg` 문구로 대체한다. */
  organizationName: string | null;
  todayLabel: string;
  weekStart: string;
}

/**
 * 취소된 수업은 일정이 아니다.
 *
 * `GET /schedules` 는 호출자가 `status` 를 주지 않으면 **취소 건까지 함께 돌려준다**
 * (`buildDateAndStatusWhere` 는 `query.status` 가 있을 때만 필터한다). 그대로 세면
 * 주간 리본 막대와 건수가 부풀고, 치료사는 없는 수업을 있다고 읽는다.
 */
function excludeCanceled(schedules: ScheduleResponseDto[]): ScheduleResponseDto[] {
  return schedules.filter((s) => s.status !== ScheduleStatus.CANCELED);
}

/**
 * 요일별 세션 "수"를 센다 — 있음/없음이 아니라 개수여야 주간 밀도가 읽힌다
 * (`WeekRibbon` 이 막대 높이로 인코딩한다).
 */
function buildWeekDays(
  weekStart: Date,
  schedules: ScheduleResponseDto[],
  dowLabels: readonly string[],
) {
  const countByDate = new Map<string, number>();
  for (const s of schedules) {
    const key = toKSTDateString(s.startAt);
    countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
  }
  const todayStr = toKSTDateString(new Date());

  return dowLabels.map((dow, i) => {
    const day = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = toKSTDateString(day);
    return { dow, dateStr, count: countByDate.get(dateStr) ?? 0, isToday: dateStr === todayStr };
  });
}

export function TherapistDashboard({
  todayInitialData,
  weekInitialData,
  userProfile,
  organizationName,
  todayLabel,
  weekStart,
}: Props) {
  const t = useTranslations('widgets.therapistDashboard');
  const tSchedule = useTranslations('entities.schedule');
  const { data: todayRaw = [] } = useTodaySchedules(todayInitialData);
  const { data: weekRaw = [] } = useWeekSchedules(weekInitialData);

  // 건수와 목록이 같은 기준을 쓰도록 한 번만 거른다
  const todaySchedules = excludeCanceled(todayRaw);
  const weekSchedules = excludeCanceled(weekRaw);

  const weekStartParsed = new Date(weekStart);
  const weekDays = buildWeekDays(weekStartParsed, weekSchedules, tSchedule.raw('dow'));

  return (
    <div className="pb-24">
      <section className="px-5 mt-4">
        <p className="text-eyebrow font-semibold text-gray-700">{todayLabel}</p>
        <h1 className="text-title font-extrabold tracking-tighter text-gray-900 mt-1.5">
          {t('greeting')} {userProfile?.name ?? '—'} {t('greetingSuffix')}
        </h1>
        <p className="text-body2 text-gray-600 mt-1">{organizationName ?? t('noOrg')}</p>
      </section>

      {/* 주간 리본 — 오늘 일정보다 먼저. 치료사는 "이번 주가 어떻게 생겼나"를
          먼저 보고 오늘로 들어온다. */}
      <section className="px-5 mt-7">
        <SectionHeader
          title={t('weekScheduleCount', { count: weekSchedules.length })}
          right={
            <Link
              href="/schedules"
              className="text-body2 text-gray-600 font-semibold no-underline hover:text-brand transition-colors"
            >
              {t('viewAll')}
            </Link>
          }
        />
        <div className="mt-3.5">
          <WeekRibbon
            days={weekDays}
            label={t('weekRibbonLabel')}
            countLabel={(count) => t('weekRibbonCount', { count })}
          />
        </div>
      </section>

      <section className="px-5 mt-8">
        <SectionHeader
          title={t('todayScheduleCount', { count: todaySchedules.length })}
          right={null}
        />
        {todaySchedules.length === 0 ? (
          // 빈 화면은 상태 보고가 아니라 할 일 안내다
          <div className="mt-3 rounded-xl border border-dashed border-gray-300 px-5 py-8">
            <p className="text-body text-gray-600 m-0">{t('noTodaySchedule')}</p>
            <Link
              href="/schedules"
              className="inline-block mt-2 text-body font-bold text-brand no-underline underline-offset-4 hover:underline"
            >
              {t('noTodayScheduleAction')}
            </Link>
          </div>
        ) : (
          // 시각이 왼쪽 축으로 정렬돼 시간표처럼 읽힌다. 카드 대신 가는 구분선.
          <ul className="mt-1 list-none p-0 m-0 divide-y divide-gray-100">
            {todaySchedules.map((s) => (
              <li key={s.id}>
                <Link href={`/schedules/${s.id}`} className="block no-underline">
                  <TimeRail time={formatTime(s.startAt)} title={s.childName} subtitle={s.title} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
