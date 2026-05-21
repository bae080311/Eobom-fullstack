import type { NotificationType, ScheduleStatus, UserRole } from '../enums';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChild {
  id: string;
  name: string;
  birthDate: Date | null;
  therapistId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChildParent {
  childId: string;
  parentId: string;
  linkedAt: Date;
}

export interface IInviteCode {
  id: string;
  code: string;
  childId: string;
  createdById: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface ISchedule {
  id: string;
  childId: string;
  therapistId: string;
  startAt: Date;
  endAt: Date;
  status: ScheduleStatus;
  note: string | null;
  isRecurring: boolean;
  recurringId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduleConfirmation {
  id: string;
  scheduleId: string;
  parentId: string;
  confirmedAt: Date;
}

export interface INotification {
  id: string;
  userId: string;
  scheduleId: string | null;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
