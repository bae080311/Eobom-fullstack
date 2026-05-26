import type { OrgMemberRole, OrgMembershipStatus } from '../enums';

export interface CreateOrganizationDto {
  name: string;
}

export interface OrganizationResponseDto {
  id: string;
  name: string;
  joinCode: string;
  membership: {
    id: string;
    role: OrgMemberRole;
  };
}

export interface MemberResponseDto {
  id: string;
  role: OrgMemberRole;
  status: OrgMembershipStatus;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RotateJoinCodeResponseDto {
  joinCode: string;
  rotatedAt: string;
}

export interface UpdateMembershipDto {
  role?: OrgMemberRole;
}
