import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").optional(),
  phoneNumber: z.string().min(1, "전화번호를 입력해주세요").optional(),
  licenseNumber: z.string().min(1, "면허번호를 입력해주세요").optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

/**
 * 계정 삭제는 되돌릴 수 없다(개인식별정보를 즉시 익명화한다). access token만으로
 * 실행되면 탈취된 토큰 하나로 계정이 사라지므로 비밀번호를 다시 받는다.
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export type DeleteAccountDto = z.infer<typeof deleteAccountSchema>;
