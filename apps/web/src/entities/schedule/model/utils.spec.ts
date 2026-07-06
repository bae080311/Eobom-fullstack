import { describe, it, expect } from 'vitest';
import { ScheduleStatus } from '@eobom/shared';
import type { ScheduleResponseDto } from '@eobom/shared';
import { mapScheduleToUpcoming, mapScheduleToNextSession, buildWeekDays } from './utils';

// now = 2026-06-19T05:00:00.000Z → KST 2026-06-19 (금) 14:00
const NOW = new Date('2026-06-19T05:00:00.000Z');

function makeSchedule(overrides: Partial<ScheduleResponseDto> = {}): ScheduleResponseDto {
  return {
    id: 's1',
    childId: 'c1',
    childName: '도윤',
    therapistId: 't1',
    startAt: '2026-06-19T08:30:00.000Z',
    endAt: '2026-06-19T09:10:00.000Z',
    status: ScheduleStatus.SCHEDULED,
    title: '개별 언어치료',
    notes: null,
    therapistName: '정유진',
    ...overrides,
  };
}

describe('mapScheduleToUpcoming', () => {
  it('KST 기준 요일 약어를 반환한다', () => {
    const result = mapScheduleToUpcoming(makeSchedule(), NOW);
    expect(result.day).toBe('금');
  });

  it('KST 기준 day-of-month를 문자열로 반환한다', () => {
    const result = mapScheduleToUpcoming(makeSchedule(), NOW);
    expect(result.date).toBe('19');
  });

  it('time은 formatTime 형식(HH:mm)이다', () => {
    const result = mapScheduleToUpcoming(makeSchedule(), NOW);
    expect(result.time).toBe('17:30');
  });

  it('type은 title, child는 childName이다', () => {
    const result = mapScheduleToUpcoming(
      makeSchedule({ title: '유창성 치료', childName: '지호' }),
      NOW,
    );
    expect(result.type).toBe('유창성 치료');
    expect(result.child).toBe('지호');
  });

  it('therapistName이 있으면 therapist에 반영한다', () => {
    const result = mapScheduleToUpcoming(makeSchedule({ therapistName: '정유진' }), NOW);
    expect(result.therapist).toBe('정유진');
  });

  it('therapistName이 없으면 therapist는 빈 문자열이다', () => {
    const result = mapScheduleToUpcoming(makeSchedule({ therapistName: undefined }), NOW);
    expect(result.therapist).toBe('');
  });

  it('같은 KST 날짜면 status는 today이다', () => {
    const result = mapScheduleToUpcoming(
      makeSchedule({ startAt: '2026-06-19T08:30:00.000Z' }),
      NOW,
    );
    expect(result.status).toBe('today');
  });

  it('미래 KST 날짜면 status는 upcoming이다', () => {
    const result = mapScheduleToUpcoming(
      makeSchedule({ startAt: '2026-06-20T08:30:00.000Z' }),
      NOW,
    );
    expect(result.status).toBe('upcoming');
  });

  it('과거 KST 날짜면 status는 past이다', () => {
    const result = mapScheduleToUpcoming(
      makeSchedule({ startAt: '2026-06-18T08:30:00.000Z' }),
      NOW,
    );
    expect(result.status).toBe('past');
  });

  it('같은 KST 날짜지만 이미 지난 시각이면 status는 past이다', () => {
    // NOW = KST 14:00, startAt = KST 09:00 (같은 날, 이미 지남)
    const result = mapScheduleToUpcoming(
      makeSchedule({ startAt: '2026-06-19T00:00:00.000Z' }),
      NOW,
    );
    expect(result.status).toBe('past');
  });
});

describe('mapScheduleToNextSession', () => {
  it('오늘 일정이면 dateLabel에 "오늘 "이 붙는다', () => {
    const result = mapScheduleToNextSession(
      makeSchedule({ startAt: '2026-06-19T08:30:00.000Z' }),
      NOW,
    );
    expect(result.dateLabel.startsWith('오늘 ')).toBe(true);
    expect(result.dateLabel).toContain('6월 19일');
  });

  it('오늘이 아니면 dateLabel에 "오늘 "이 붙지 않는다', () => {
    const result = mapScheduleToNextSession(
      makeSchedule({ startAt: '2026-06-20T08:30:00.000Z' }),
      NOW,
    );
    expect(result.dateLabel.startsWith('오늘 ')).toBe(false);
    expect(result.dateLabel).toContain('6월 20일');
  });

  it('timeLabel은 formatTime 형식이다', () => {
    const result = mapScheduleToNextSession(makeSchedule(), NOW);
    expect(result.timeLabel).toBe('17:30');
  });

  it('timeUntil은 시간과 분이 모두 있으면 "N시간 M분 뒤" 형식이다', () => {
    // 14:00 → 17:30 = 3시간 30분
    const result = mapScheduleToNextSession(
      makeSchedule({ startAt: '2026-06-19T08:30:00.000Z' }),
      NOW,
    );
    expect(result.timeUntil).toBe('3시간 30분 뒤');
  });

  it('timeUntil은 분이 0이면 "N시간 뒤" 형식이다', () => {
    // 14:00 → 16:00 = 2시간
    const result = mapScheduleToNextSession(
      makeSchedule({ startAt: '2026-06-19T07:00:00.000Z' }),
      NOW,
    );
    expect(result.timeUntil).toBe('2시간 뒤');
  });

  it('timeUntil은 시간이 0이면 "N분 뒤" 형식이다', () => {
    // 14:00 → 14:20 = 20분
    const result = mapScheduleToNextSession(
      makeSchedule({ startAt: '2026-06-19T05:20:00.000Z' }),
      NOW,
    );
    expect(result.timeUntil).toBe('20분 뒤');
  });

  it('1분 미만 남았으면 timeUntil은 "곧 시작"이다', () => {
    // 14:00 → 14:00:30 = 30초
    const result = mapScheduleToNextSession(
      makeSchedule({ startAt: '2026-06-19T05:00:30.000Z' }),
      NOW,
    );
    expect(result.timeUntil).toBe('곧 시작');
  });

  it('과거 일정이면 timeUntil은 빈 문자열이다', () => {
    const result = mapScheduleToNextSession(
      makeSchedule({ startAt: '2026-06-18T08:30:00.000Z' }),
      NOW,
    );
    expect(result.timeUntil).toBe('');
  });

  it('location 필드는 포함하지 않는다', () => {
    const result = mapScheduleToNextSession(makeSchedule(), NOW);
    expect(result.location).toBeUndefined();
  });

  it('therapistName이 없으면 therapistName은 빈 문자열이다', () => {
    const result = mapScheduleToNextSession(makeSchedule({ therapistName: undefined }), NOW);
    expect(result.therapistName).toBe('');
  });
});

describe('buildWeekDays', () => {
  // weekStart = 2026-06-15T00:00:00 KST (월) = 2026-06-14T15:00:00.000Z
  const WEEK_START = new Date('2026-06-14T15:00:00.000Z');

  it('7일치를 월~일 순서로 반환한다', () => {
    const result = buildWeekDays(WEEK_START, [], NOW);
    expect(result.map((d) => d.dow)).toEqual(['월', '화', '수', '목', '금', '토', '일']);
  });

  it('각 날짜의 day-of-month를 올바르게 계산한다', () => {
    const result = buildWeekDays(WEEK_START, [], NOW);
    expect(result.map((d) => d.num)).toEqual([15, 16, 17, 18, 19, 20, 21]);
  });

  it('now와 같은 KST 날짜인 요일만 today가 true이다', () => {
    const result = buildWeekDays(WEEK_START, [], NOW);
    const todayFlags = result.map((d) => d.today);
    expect(todayFlags).toEqual([false, false, false, false, true, false, false]);
  });

  it('일정이 있는 날짜는 hasSession이 true이다', () => {
    const schedules = [makeSchedule({ startAt: '2026-06-17T08:30:00.000Z' })]; // 6/17 (수)
    const result = buildWeekDays(WEEK_START, schedules, NOW);
    const hasSessionFlags = result.map((d) => d.hasSession);
    expect(hasSessionFlags).toEqual([false, false, true, false, false, false, false]);
  });
});
