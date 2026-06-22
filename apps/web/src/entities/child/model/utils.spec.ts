import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatKoreanAge, formatNextSessionLabel } from './utils';

describe('formatKoreanAge', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('birthDate가 null이면 null을 반환한다', () => {
    expect(formatKoreanAge(null)).toBeNull();
  });

  it('birthDate가 유효하지 않은 날짜 문자열이면 null을 반환한다', () => {
    expect(formatKoreanAge('not-a-date')).toBeNull();
  });

  it('생일이 지났으면 만 나이를 반환한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-19T00:00:00Z'));
    // 2019-03-01 출생 → 2026-06-19 기준 생일 지남 → 만 7세
    expect(formatKoreanAge('2019-03-01T00:00:00Z')).toBe('만 7세');
  });

  it('생일이 아직 안 지났으면 한 살 적게 반환한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-19T00:00:00Z'));
    // 2019-12-01 출생 → 2026-06-19 기준 생일 전 → 만 6세
    expect(formatKoreanAge('2019-12-01T00:00:00Z')).toBe('만 6세');
  });
});

describe('formatNextSessionLabel', () => {
  it('nextSessionAt이 null이면 "예정된 일정 없음"을 반환한다', () => {
    expect(formatNextSessionLabel(null)).toBe('예정된 일정 없음');
  });

  it('nextSessionAt이 있으면 KST 날짜·시간 라벨을 만든다', () => {
    // 2026-06-20T01:00:00Z → KST 2026-06-20 10:00
    const label = formatNextSessionLabel('2026-06-20T01:00:00Z');
    expect(label).toContain('다음 일정');
    expect(label).toContain('6월 20일');
    expect(label).toContain('10:00');
  });
});
