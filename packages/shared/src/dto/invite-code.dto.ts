import { z } from "zod";
import { ParentRelation } from "../enums/index.js";
import type { InviteCodeType, InviteCodeStatus } from "../enums/index.js";

export const issueParentLinkCodeSchema = z.object({
  childId: z.string().min(1, "아동을 선택해주세요"),
  ttlMinutes: z
    .number()
    .int()
    .positive()
    .max(7 * 24 * 60)
    .optional(),
});

export type IssueParentLinkCodeDto = z.infer<typeof issueParentLinkCodeSchema>;

export const redeemInviteCodeSchema = z.object({
  code: z.string().min(1, "초대 코드를 입력해주세요"),
  relation: z.nativeEnum(ParentRelation),
});

export type RedeemInviteCodeDto = z.infer<typeof redeemInviteCodeSchema>;

export interface InviteCodeResponseDto {
  id: string;
  code: string;
  type: InviteCodeType;
  status: InviteCodeStatus;
  expiresAt: string;
  createdAt: string;
  child: { id: string; name: string } | null;
  organization: { id: string; name: string };
}

export interface RedeemInviteCodeResponseDto {
  child: { id: string; name: string };
  organization: { id: string; name: string };
  primaryTherapist: { id: string; name: string } | null;
  relation: ParentRelation;
}
