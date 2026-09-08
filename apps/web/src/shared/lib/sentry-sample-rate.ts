/**
 * 샘플링 비율 파싱. 환경변수는 항상 문자열이라 직접 변환해야 한다.
 *
 * 0~1을 벗어나거나 숫자가 아니면 기본값으로 되돌린다 — 오타 하나로 전량 샘플링이
 * 켜져 요금이 튀거나, NaN이 들어가 SDK가 조용히 이상 동작하는 것을 막는다.
 */
export const parseSampleRate = (raw: string | undefined, fallback: number): number => {
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) return fallback;
  return parsed;
};
