import { describe, it, expect } from 'vitest';
import { ScheduleStatus } from '@eobom/shared';
import { SCHEDULE_STATUS_COLOR } from './status';
import ko from '../../../../messages/ko.json';

const ALL_STATUSES: ScheduleStatus[] = [
  ScheduleStatus.SCHEDULED,
  ScheduleStatus.RESCHEDULED,
  ScheduleStatus.CANCELED,
  ScheduleStatus.COMPLETED,
];

describe('entities.schedule.status 메시지', () => {
  it('모든 ScheduleStatus 값에 번역 라벨이 존재한다', () => {
    for (const status of ALL_STATUSES) {
      expect(ko.entities.schedule.status[status]).toBeTruthy();
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

  it('COMPLETED 컬러 클래스에 bg-gray-100과 text-gray-700이 포함된다', () => {
    const cls = SCHEDULE_STATUS_COLOR[ScheduleStatus.COMPLETED];
    expect(cls).toContain('bg-gray-100');
    expect(cls).toContain('text-gray-700');
  });

  it('모든 ScheduleStatus 값에 컬러 클래스가 존재한다', () => {
    for (const status of ALL_STATUSES) {
      expect(SCHEDULE_STATUS_COLOR[status]).toBeTruthy();
    }
  });
});
