import { z } from "zod";
import { OrgMemberRole } from "../enums/index.js";
import type { OrgMembershipStatus } from "../enums/index.js";

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "기관 이름을 입력해주세요"),
});

export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = createOrganizationSchema.partial();

export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;

export const updateMembershipSchema = z.object({
  role: z.nativeEnum(OrgMemberRole).optional(),
});

export type UpdateMembershipDto = z.infer<typeof updateMembershipSchema>;

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
