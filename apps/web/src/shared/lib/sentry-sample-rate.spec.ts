import { describe, it, expect } from 'vitest';

import { parseSampleRate } from './sentry-sample-rate';

describe('parseSampleRate', () => {
  it('정상 범위의 값을 그대로 쓴다', () => {
    expect(parseSampleRate('0.25', 0.1)).toBe(0.25);
    expect(parseSampleRate('0', 0.1)).toBe(0);
    expect(parseSampleRate('1', 0.1)).toBe(1);
  });

  it('미설정·빈 문자열이면 기본값을 쓴다', () => {
    expect(parseSampleRate(undefined, 0.1)).toBe(0.1);
    expect(parseSampleRate('', 0.1)).toBe(0.1);
  });

  // 오타 하나로 전량 샘플링이 켜져 요금이 튀거나, NaN이 들어가
  // SDK가 조용히 이상 동작하는 것을 막는다.
  it('숫자가 아니거나 0~1을 벗어나면 기본값으로 되돌린다', () => {
    expect(parseSampleRate('abc', 0.1)).toBe(0.1);
    expect(parseSampleRate('1.5', 0.1)).toBe(0.1);
    expect(parseSampleRate('-0.2', 0.1)).toBe(0.1);
  });
});
