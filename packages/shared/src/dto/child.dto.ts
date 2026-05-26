import type { ParentRelation } from '../enums';

export interface CreateChildDto {
  name: string;
  birthDate?: string;
  memo?: string;
  primaryTherapistId?: string | null;
}

export interface UpdateChildDto {
  name?: string;
  birthDate?: string;
  memo?: string;
}

export interface SetPrimaryTherapistDto {
  primaryTherapistId: string;
}

export interface IssueParentLinkCodeDto {
  childId: string;
  ttlMinutes?: number;
}

export interface RedeemInviteCodeDto {
  code: string;
  relation: ParentRelation;
}
