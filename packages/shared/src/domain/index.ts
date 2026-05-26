import type {
  UserRole,
  OrgMemberRole,
  OrgMembershipStatus,
  ParentRelation,
  InviteCodeType,
  InviteCodeStatus,
  ScheduleStatus,
  NotificationType,
} from "../enums/index.js";

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITherapistProfile {
  id: string;
  userId: string;
  licenseNumber: string | null;
}

export interface IParentProfile {
  id: string;
  userId: string;
  phoneNumber: string | null;
}

export interface IOrganization {
  id: string;
  name: string;
  joinCode: string;
  joinCodeRotatedAt: Date;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrganizationMembership {
  id: string;
  organizationId: string;
  therapistProfileId: string;
  role: OrgMemberRole;
  status: OrgMembershipStatus;
  joinedAt: Date;
  leftAt: Date | null;
}

export interface IChild {
  id: string;
  name: string;
  birthDate: Date | null;
  organizationId: string;
  primaryTherapistId: string | null;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IParentChildLink {
  id: string;
  parentId: string;
  childId: string;
  relation: ParentRelation;
  linkedAt: Date;
}

export interface IInviteCode {
  id: string;
  code: string;
  type: InviteCodeType;
  organizationId: string;
  childId: string | null;
  issuedById: string;
  status: InviteCodeStatus;
  expiresAt: Date;
  usedAt: Date | null;
  usedByParentId: string | null;
  createdAt: Date;
}

export interface ISchedule {
  id: string;
  organizationId: string;
  childId: string;
  therapistId: string;
  startAt: Date;
  endAt: Date;
  status: ScheduleStatus;
  title: string;
  notes: string | null;
  recurringRuleId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecurringRule {
  id: string;
  organizationId: string;
  childId: string;
  therapistId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  timezone: string;
  startDate: Date;
  endDate: Date | null;
  active: boolean;
  createdAt: Date;
}

export interface IScheduleAcknowledgement {
  id: string;
  scheduleId: string;
  parentId: string;
  acknowledgedAt: Date;
}

export interface INotification {
  id: string;
  parentId: string;
  type: NotificationType;
  organizationId: string | null;
  scheduleId: string | null;
  childId: string | null;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}
