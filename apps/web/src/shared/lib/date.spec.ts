import { describe, it, expect } from 'vitest';
import { formatTime, formatDateLabel } from './date';

describe('formatTime', () => {
  it('시·분을 HH:mm 형식으로 반환한다', () => {
    // 2024-01-15 09:05 KST 기준 로컬 시각을 ISO로 구성
    const d = new Date(2024, 0, 15, 9, 5, 0);
    expect(formatTime(d.toISOString())).toBe('09:05');
  });

  it('자정(00:00)을 올바르게 처리한다', () => {
    const d = new Date(2024, 0, 15, 0, 0, 0);
    expect(formatTime(d.toISOString())).toBe('00:00');
  });

  it('오후 시각(13:30)을 올바르게 처리한다', () => {
    const d = new Date(2024, 0, 15, 13, 30, 0);
    expect(formatTime(d.toISOString())).toBe('13:30');
  });

  it('23:59를 올바르게 처리한다', () => {
    const d = new Date(2024, 0, 15, 23, 59, 0);
    expect(formatTime(d.toISOString())).toBe('23:59');
  });

  it('분이 한 자리일 때 앞에 0을 붙인다', () => {
    const d = new Date(2024, 0, 15, 10, 3, 0);
    expect(formatTime(d.toISOString())).toBe('10:03');
  });
});

describe('formatDateLabel', () => {
  it('월·일·요일을 "MM월 DD일 (요일)" 형식으로 반환한다', () => {
    // 2024-01-01은 월요일
    const d = new Date(2024, 0, 1, 10, 0, 0);
    expect(formatDateLabel(d.toISOString())).toBe('1월 1일 (월)');
  });

  it('일요일(일)을 올바르게 표시한다', () => {
    // 2024-01-07은 일요일
    const d = new Date(2024, 0, 7, 10, 0, 0);
    expect(formatDateLabel(d.toISOString())).toBe('1월 7일 (일)');
  });

  it('토요일(토)을 올바르게 표시한다', () => {
    // 2024-01-06은 토요일
    const d = new Date(2024, 0, 6, 10, 0, 0);
    expect(formatDateLabel(d.toISOString())).toBe('1월 6일 (토)');
  });

  it('월이 두 자리인 경우(12월)를 올바르게 처리한다', () => {
    // 2024-12-25는 수요일
    const d = new Date(2024, 11, 25, 10, 0, 0);
    expect(formatDateLabel(d.toISOString())).toBe('12월 25일 (수)');
  });

  it('월이 1월이면 앞에 0을 붙이지 않는다', () => {
    const d = new Date(2024, 0, 5, 10, 0, 0);
    const result = formatDateLabel(d.toISOString());
    expect(result).toMatch(/^1월/);
  });
});
