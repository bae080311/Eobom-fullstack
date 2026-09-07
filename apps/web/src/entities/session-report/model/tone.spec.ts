import { describe, it, expect } from 'vitest';
import { resolveSessionReportTone, SESSION_REPORT_TONE_COLOR } from './tone';
import { SESSION_REPORT_TONES } from './types';

describe('resolveSessionReportTone', () => {
  it('계약에 있는 톤 값은 그대로 돌려준다', () => {
    for (const tone of SESSION_REPORT_TONES) {
      expect(resolveSessionReportTone(tone)).toBe(tone);
    }
  });

  it('LLM이 계약을 벗어난 값을 주면 neutral로 흡수한다', () => {
    expect(resolveSessionReportTone('excellent')).toBe('neutral');
    expect(resolveSessionReportTone('')).toBe('neutral');
    expect(resolveSessionReportTone('POSITIVE')).toBe('neutral');
  });
});

describe('SESSION_REPORT_TONE_COLOR', () => {
  it('모든 톤 값에 색상 클래스가 정의돼 있다', () => {
    for (const tone of SESSION_REPORT_TONES) {
      expect(SESSION_REPORT_TONE_COLOR[tone]).toBeTruthy();
    }
  });
});
