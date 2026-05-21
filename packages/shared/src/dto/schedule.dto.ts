import type { ScheduleStatus } from '../enums';

export interface CreateScheduleDto {
  childId: string;
  startAt: string;
  endAt: string;
  note?: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
}

export interface UpdateScheduleDto {
  startAt?: string;
  endAt?: string;
  note?: string;
  status?: ScheduleStatus;
}

export interface RecurringPattern {
  frequency: 'WEEKLY' | 'BIWEEKLY';
  endDate: string;
  daysOfWeek: number[];
}

export interface ScheduleQueryDto {
  childId?: string;
  startDate?: string;
  endDate?: string;
  status?: ScheduleStatus;
}
