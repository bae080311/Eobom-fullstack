export enum UserRole {
  THERAPIST = "THERAPIST",
  PARENT = "PARENT",
}

export enum OrgMemberRole {
  OWNER = "OWNER",
  THERAPIST = "THERAPIST",
}

export enum OrgMembershipStatus {
  ACTIVE = "ACTIVE",
  LEFT = "LEFT",
}

export enum ParentRelation {
  MOTHER = "MOTHER",
  FATHER = "FATHER",
  GUARDIAN = "GUARDIAN",
  OTHER = "OTHER",
}

export enum InviteCodeType {
  THERAPIST_JOIN = "THERAPIST_JOIN",
  PARENT_LINK = "PARENT_LINK",
}

export enum InviteCodeStatus {
  ACTIVE = "ACTIVE",
  USED = "USED",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
}

export enum ScheduleStatus {
  SCHEDULED = "SCHEDULED",
  RESCHEDULED = "RESCHEDULED",
  CANCELED = "CANCELED",
  COMPLETED = "COMPLETED",
}

export enum NotificationType {
  SCHEDULE_CREATED = "SCHEDULE_CREATED",
  SCHEDULE_UPDATED = "SCHEDULE_UPDATED",
  SCHEDULE_CANCELED = "SCHEDULE_CANCELED",
  /** 세션 리포트가 처음 작성됐을 때. 재생성 시에는 보내지 않는다. */
  SESSION_REPORT_CREATED = "SESSION_REPORT_CREATED",
}
