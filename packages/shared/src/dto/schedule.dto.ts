import type { ScheduleStatus } from '../enums';

export interface CreateScheduleDto {
  childId: string;
  startAt: string;
  endAt: string;
  title: string;
  notes?: string;
  therapistId?: string | null;
}

export interface UpdateScheduleDto {
  startAt?: string;
  endAt?: string;
  title?: string;
  notes?: string;
  therapistId?: string;
}

export interface CreateRecurringScheduleDto {
  childId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  timezone: string;
  startDate: string;
  endDate?: string;
  title: string;
  therapistId?: string | null;
}

export interface ScheduleQueryDto {
  childId?: string;
  organizationId?: string;
  from?: string;
  to?: string;
  status?: ScheduleStatus;
}
