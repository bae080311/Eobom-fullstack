import { describe, it, expect } from 'vitest';
import { ScheduleStatus } from '@eobom/shared';
import { SCHEDULE_STATUS_LABEL, SCHEDULE_STATUS_COLOR } from './status';

const ALL_STATUSES: ScheduleStatus[] = [
  ScheduleStatus.SCHEDULED,
  ScheduleStatus.RESCHEDULED,
  ScheduleStatus.CANCELED,
  ScheduleStatus.COMPLETED,
];

describe('SCHEDULE_STATUS_LABEL', () => {
  it('SCHEDULED 레이블은 "예정"이다', () => {
    expect(SCHEDULE_STATUS_LABEL[ScheduleStatus.SCHEDULED]).toBe('예정');
  });

  it('RESCHEDULED 레이블은 "변경됨"이다', () => {
    expect(SCHEDULE_STATUS_LABEL[ScheduleStatus.RESCHEDULED]).toBe('변경됨');
  });

  it('CANCELED 레이블은 "취소됨"이다', () => {
    expect(SCHEDULE_STATUS_LABEL[ScheduleStatus.CANCELED]).toBe('취소됨');
  });

  it('COMPLETED 레이블은 "완료"이다', () => {
    expect(SCHEDULE_STATUS_LABEL[ScheduleStatus.COMPLETED]).toBe('완료');
  });

  it('모든 ScheduleStatus 값에 레이블이 존재한다', () => {
    for (const status of ALL_STATUSES) {
      expect(SCHEDULE_STATUS_LABEL[status]).toBeTruthy();
    }
  });
});

describe('SCHEDULE_STATUS_COLOR', () => {
  it('SCHEDULED 컬러 클래스에 bg-brand-soft와 text-brand-ink가 포함된다', () => {
    const cls = SCHEDULE_STATUS_COLOR[ScheduleStatus.SCHEDULED];
    expect(cls).toContain('bg-brand-soft');
    expect(cls).toContain('text-brand-ink');
  });

  it('RESCHEDULED 컬러 클래스에 bg-yellow-100과 text-yellow-800이 포함된다', () => {
    const cls = SCHEDULE_STATUS_COLOR[ScheduleStatus.RESCHEDULED];
    expect(cls).toContain('bg-yellow-100');
    expect(cls).toContain('text-yellow-800');
  });

  it('CANCELED 컬러 클래스에 bg-danger-soft와 text-danger가 포함된다', () => {
    const cls = SCHEDULE_STATUS_COLOR[ScheduleStatus.CANCELED];
    expect(cls).toContain('bg-danger-soft');
    expect(cls).toContain('text-danger');
  });

  it('COMPLETED 컬러 클래스에 bg-gray-100과 text-gray-500이 포함된다', () => {
    const cls = SCHEDULE_STATUS_COLOR[ScheduleStatus.COMPLETED];
    expect(cls).toContain('bg-gray-100');
    expect(cls).toContain('text-gray-500');
  });

  it('모든 ScheduleStatus 값에 컬러 클래스가 존재한다', () => {
    for (const status of ALL_STATUSES) {
      expect(SCHEDULE_STATUS_COLOR[status]).toBeTruthy();
    }
  });
});
