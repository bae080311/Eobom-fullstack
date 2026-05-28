import { describe, it, expect } from 'vitest';
import { formatTime, formatDateLabel } from './date';

describe('formatTime', () => {
  it('시·분을 HH:mm 형식으로 반환한다', () => {
    expect(formatTime('2024-01-15T00:05:00Z')).toBe('09:05'); // KST 09:05 = UTC 00:05
  });

  it('자정(00:00)을 올바르게 처리한다', () => {
    expect(formatTime('2024-01-14T15:00:00Z')).toBe('00:00'); // KST 00:00 = UTC 전날 15:00
  });

  it('오후 시각(13:30)을 올바르게 처리한다', () => {
    expect(formatTime('2024-01-15T04:30:00Z')).toBe('13:30'); // KST 13:30 = UTC 04:30
  });

  it('23:59를 올바르게 처리한다', () => {
    expect(formatTime('2024-01-15T14:59:00Z')).toBe('23:59'); // KST 23:59 = UTC 14:59
  });

  it('분이 한 자리일 때 앞에 0을 붙인다', () => {
    expect(formatTime('2024-01-15T01:03:00Z')).toBe('10:03'); // KST 10:03 = UTC 01:03
  });
});

describe('formatDateLabel', () => {
  it('월·일·요일을 "MM월 DD일 (요일)" 형식으로 반환한다', () => {
    // 2024-01-01 KST 10:00 = UTC 01:00 → 월요일
    expect(formatDateLabel('2024-01-01T01:00:00Z')).toBe('1월 1일 (월)');
  });

  it('일요일(일)을 올바르게 표시한다', () => {
    // 2024-01-07 KST 10:00 = UTC 01:00 → 일요일
    expect(formatDateLabel('2024-01-07T01:00:00Z')).toBe('1월 7일 (일)');
  });

  it('토요일(토)을 올바르게 표시한다', () => {
    // 2024-01-06 KST 10:00 = UTC 01:00 → 토요일
    expect(formatDateLabel('2024-01-06T01:00:00Z')).toBe('1월 6일 (토)');
  });

  it('월이 두 자리인 경우(12월)를 올바르게 처리한다', () => {
    // 2024-12-25 KST 10:00 = UTC 01:00 → 수요일
    expect(formatDateLabel('2024-12-25T01:00:00Z')).toBe('12월 25일 (수)');
  });

  it('월이 1월이면 앞에 0을 붙이지 않는다', () => {
    // 2024-01-05 KST 10:00 = UTC 01:00
    expect(formatDateLabel('2024-01-05T01:00:00Z')).toMatch(/^1월/);
  });
});
