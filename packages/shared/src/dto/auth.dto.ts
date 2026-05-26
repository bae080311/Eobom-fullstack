import type { UserRole, OrgMemberRole } from "../enums/index.js";

export interface SignupOrganizationCreate {
  mode: "CREATE";
  name: string;
}

export interface SignupOrganizationJoin {
  mode: "JOIN";
  joinCode: string;
}

export interface SignupDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  organization?: SignupOrganizationCreate | SignupOrganizationJoin;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ActiveOrgMembership {
  organizationId: string;
  organizationName: string;
  role: OrgMemberRole;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  activeOrgMembership?: ActiveOrgMembership;
}
