import { z } from "zod";
import type { UserRole } from "../enums/index.js";

/**
 * `GET /users/me` · `PATCH /users/me` 가 돌려주는 필드 전부.
 *
 * 이 타입에 없는 것은 응답에 실리지 않는다 — 특히 `passwordHash`. 서비스가 Prisma
 * 행을 통째로 반환하면 비밀번호 해시가 클라이언트까지 내려가므로, 서비스는 이
 * 계약과 같은 `select` 로 필드를 못박는다.
 */
export interface UserProfileResponseDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  therapistProfile: { licenseNumber: string | null } | null;
  parentProfile: { phoneNumber: string | null } | null;
}

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
