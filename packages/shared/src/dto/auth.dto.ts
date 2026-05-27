import { z } from "zod";
import { UserRole } from "../enums/index.js";
import type { OrgMemberRole } from "../enums/index.js";

export const signupOrganizationSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("CREATE"),
    name: z.string().min(1, "기관 이름을 입력해주세요"),
  }),
  z.object({
    mode: z.literal("JOIN"),
    joinCode: z.string().min(1, "참여 코드를 입력해주세요"),
  }),
]);

export const signupSchema = z.object({
  email: z.email("올바른 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  name: z.string().min(1, "이름을 입력해주세요"),
  role: z.enum(UserRole),
  organization: signupOrganizationSchema.optional(),
});

export const loginSchema = z.object({
  email: z.email("올바른 이메일을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export type SignupOrganizationCreate = Extract<
  z.infer<typeof signupOrganizationSchema>,
  { mode: "CREATE" }
>;
export type SignupOrganizationJoin = Extract<
  z.infer<typeof signupOrganizationSchema>,
  { mode: "JOIN" }
>;
export type SignupDto = z.infer<typeof signupSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  email: z.email(),
  code: z.string().length(6, "인증 코드는 6자리입니다"),
});

export const resendVerificationSchema = z.object({
  email: z.email(),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationDto = z.infer<typeof resendVerificationSchema>;

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
