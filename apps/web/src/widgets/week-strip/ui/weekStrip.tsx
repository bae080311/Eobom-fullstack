import { SectionHeader } from '@/shared/ui';
import type { WeekDay } from '@/entities/schedule';

/**
 * 주간 스트립의 하루.
 *
 * `WeekRibbon`(치료사 대시보드)과 같은 언어를 쓴다 — 요일 라벨 · 아래쪽 정렬 막대.
 * 다른 점은 **날짜 숫자를 담는다**는 것뿐이다(학부모는 날짜로 이동한다).
 * 오늘을 통째로 칠하던 것은 걷어냈다. 색을 크게 쓰면 "세션 있음"을 나타내는 막대와
 * 다투어, 정작 알아야 할 정보가 묻힌다.
 */
function WeekDayCell({ day }: { day: WeekDay }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* 11px 은 AA 4.5:1 이 필요해 gray-700 을 쓴다 */}
      <span
        className={`text-eyebrow font-semibold ${day.today ? 'text-brand-ground' : 'text-gray-700'}`}
      >
        {day.dow}
      </span>
      <span
        className={`text-subhead font-bold tabular-nums leading-none ${
          day.today
            ? 'text-brand-ground bg-brand-soft rounded-full px-2 py-1'
            : 'text-gray-900 px-2 py-1'
        }`}
      >
        {day.num}
      </span>
      <span className="flex h-1.5 w-full items-end">
        <span
          aria-hidden
          className={`w-full rounded-full ${
            day.hasSession
              ? day.today
                ? 'h-1.5 bg-brand-ground'
                : 'h-1.5 bg-brand'
              : 'h-px bg-gray-200'
          }`}
        />
      </span>
    </div>
  );
}

interface Props {
  days: WeekDay[];
  rangeLabel?: string;
  // 페이지(Server Component)에서 getTranslations('widgets.weekStrip')로 미리 구한 제목.
  title: string;
}

export function WeekStrip({ days, rangeLabel, title }: Props) {
  return (
    <section className="px-5 mt-7">
      <SectionHeader
        title={title}
        right={
          rangeLabel && <span className="text-body2 text-gray-600 font-medium">{rangeLabel}</span>
        }
      />
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <WeekDayCell key={day.dow} day={day} />
        ))}
      </div>
    </section>
  );
}
