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
  therapistProfileId: string;
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

/**
 * joinCode 회전 감사 기록 1건.
 * 코드값은 담지 않는다 — 자격증명을 이력에 평문으로 남기지 않기 위해서다.
 */
export interface JoinCodeRotationResponseDto {
  id: string;
  rotatedAt: string;
  rotatedBy: {
    therapistProfileId: string;
    name: string;
  };
}
