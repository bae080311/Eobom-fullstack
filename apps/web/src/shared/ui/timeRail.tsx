interface Props {
  /**
   * 요일 한 글자. 시각 위에 작게 얹혀 "언제"를 두 단계로 읽게 한다.
   * **하루치 목록에서는 넘기지 않는다** — 모든 행이 같은 요일이면 잡음이다.
   */
  dow?: string;
  /** "14:00" — 항상 tabular 로 세로줄이 맞는다. */
  time: string;
  title: string;
  subtitle?: string;
  /** 상태 배지 등 오른쪽 끝에 붙는 것 */
  trailing?: React.ReactNode;
  /** 지난 일정은 시간 축의 목소리를 낮춘다 */
  muted?: boolean;
}

/**
 * 시간 축 행(行) — 이 앱의 시그니처.
 *
 * 카드에 담아 가운데 쌓는 대신, **시각을 왼쪽 축으로 고정**하고 내용이 오른쪽에
 * 매달리게 한다. 행이 여러 개 쌓이면 시각이 한 줄로 정렬돼 시간표처럼 읽힌다.
 * 카드·그림자를 쓰지 않는 것도 의도다 — 훑는 면(시간 면)과 읽는 면(목록)의 밀도가
 * 달라야 위계가 생긴다.
 */
export function TimeRail({ dow, time, title, subtitle, trailing, muted }: Props) {
  return (
    <div className="flex items-baseline gap-4 py-4">
      <div className="w-[68px] shrink-0">
        {/* 11px 은 작은 글자라 AA 4.5:1 이 필요하다 — gray-500(#8B95A1)은 흰 배경에서 약 3.0:1로 미달 */}
        {dow && (
          <div
            className={`text-eyebrow font-semibold ${muted ? 'text-gray-500' : 'text-gray-700'}`}
          >
            {dow}
          </div>
        )}
        <div
          className={`text-time-row font-extrabold tabular-nums ${dow ? 'mt-0.5' : ''} ${
            muted ? 'text-gray-400' : 'text-gray-900'
          }`}
        >
          {time}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={`text-callout font-semibold truncate ${
            muted ? 'text-gray-500' : 'text-gray-900'
          }`}
        >
          {title}
        </div>
        {subtitle && <div className="text-body2 text-gray-600 truncate mt-0.5">{subtitle}</div>}
      </div>

      {trailing && <div className="shrink-0 self-center">{trailing}</div>}
    </div>
  );
}
