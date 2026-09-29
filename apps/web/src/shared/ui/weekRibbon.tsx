interface Day {
  /** 요일 한 글자 (월·화·…) */
  dow: string;
  /** 그날의 세션 수 */
  count: number;
  isToday?: boolean;
}

interface Props {
  days: Day[];
  /** 스크린리더가 읽을 이 리본의 이름 (예: "이번 주 일정") */
  label: string;
  /** "N건" 처럼 개수를 읽어 줄 문구를 만드는 함수 */
  countLabel: (count: number) => string;
}

/**
 * 주간 리듬 리본 — 이 앱의 반복 모티프.
 *
 * 치료 세션은 고정 요일에 반복된다. 즉 "주(週)"는 이 제품에서 실제로 정보를 담는
 * 구조다. 이전에는 이걸 회색 점 7개로 그려 장식처럼 보였는데, 막대 높이로 **세션
 * 수를 인코딩**해 한눈에 주간 밀도가 읽히게 했다. 없는 날은 점이 아니라 가는 선이다
 * — 없음도 정보이므로 자리를 지키되 목소리는 내지 않는다.
 */
export function WeekRibbon({ days, label, countLabel }: Props) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-7 gap-1.5">
      {days.map((d, i) => {
        // 0건은 가는 선, 1건은 기본 막대, 2건 이상은 높은 막대.
        const height = d.count === 0 ? 'h-px' : d.count === 1 ? 'h-1.5' : 'h-3';
        const fill = d.count === 0 ? 'bg-gray-200' : d.isToday ? 'bg-brand-ground' : 'bg-brand';

        return (
          <div key={i} className="flex flex-col items-center gap-2">
            {/* 11px 은 AA 4.5:1 이 필요하다 — gray-500 은 흰 배경에서 약 3.0:1로 미달 */}
            <span
              className={`text-eyebrow font-semibold ${
                d.isToday ? 'text-brand-ground' : 'text-gray-700'
              }`}
            >
              {d.dow}
            </span>
            {/* 막대는 아래쪽 정렬 — 높이 차이가 바닥선 기준으로 읽혀야 밀도가 보인다 */}
            <span className="flex h-3 w-full items-end">
              <span className={`w-full rounded-full ${height} ${fill}`} aria-hidden />
            </span>
            <span className="sr-only">{`${d.dow} ${countLabel(d.count)}`}</span>
          </div>
        );
      })}
    </div>
  );
}
