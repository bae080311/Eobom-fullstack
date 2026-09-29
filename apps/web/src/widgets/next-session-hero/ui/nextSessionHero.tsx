import { IconCheck, IconRefresh } from '@/shared/ui';
import type { NextSession } from '@/entities/schedule';

interface Props {
  session: NextSession;
  // 페이지(Server Component)에서 getTranslations('widgets.nextSessionHero')로 미리 구한 문자열.
  sessionLabel: string;
  acknowledgeLabel: string;
  changeRequestLabel: string;
  /** "담당" — 치료사 이름 앞에 붙는 항목명 */
  therapistTermLabel: string;
  /** "장소" */
  locationTermLabel: string;
}

/**
 * 다음 수업 — 학부모가 앱을 켜는 유일한 이유.
 *
 * 화면에서 가장 큰 것이 **시각**이다. 진한 초록 바탕은 이 앱에서 과감함을 쓰는
 * 하나뿐인 자리고, 나머지 면은 조용히 둔다. 이전의 장식용 반투명 원 두 개는
 * 걷어냈다 — 아무것도 뜻하지 않으면서 시선만 가져갔다.
 */
export function NextSessionHero({
  session: s,
  sessionLabel,
  acknowledgeLabel,
  changeRequestLabel,
  therapistTermLabel,
  locationTermLabel,
}: Props) {
  return (
    <section className="bg-brand-ground text-white rounded-[22px] px-[22px] pt-5 pb-[18px] mx-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-eyebrow font-semibold text-white/70">{s.dateLabel}</span>
        <span className="text-eyebrow font-bold text-white/90 tabular-nums">{s.timeUntil}</span>
      </div>

      {/* 시각이 주인공 — Pretendard Variable 의 가장 무거운 축 + 음의 자간 */}
      <div className="mt-3 text-time font-black tabular-nums text-white">{s.timeLabel}</div>

      <div className="mt-2.5 text-callout font-semibold text-white/90">{sessionLabel}</div>

      <dl className="mt-4 pt-4 border-t border-white/15 flex flex-wrap gap-x-6 gap-y-1.5 text-body2">
        <div className="flex gap-2">
          <dt className="text-white/50">{therapistTermLabel}</dt>
          <dd className="text-white/90 m-0">{s.therapistName}</dd>
        </div>
        {s.location && (
          <div className="flex gap-2">
            <dt className="text-white/50">{locationTermLabel}</dt>
            <dd className="text-white/90 m-0">{s.location}</dd>
          </div>
        )}
      </dl>

      <div className="flex gap-2 mt-[18px]">
        <button
          type="button"
          className="flex-1 bg-white text-brand-ground rounded-[10px] py-3 px-[14px] font-bold text-body inline-flex items-center justify-center gap-1.5 border-0 cursor-pointer font-sans transition-colors active:bg-white/85 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <IconCheck size={16} /> {acknowledgeLabel}
        </button>
        <button
          type="button"
          className="flex-1 bg-white/10 text-white rounded-[10px] py-3 px-[14px] font-bold text-body inline-flex items-center justify-center gap-1.5 border border-white/25 cursor-pointer font-sans transition-colors active:bg-white/20 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <IconRefresh size={16} /> {changeRequestLabel}
        </button>
      </div>
    </section>
  );
}
