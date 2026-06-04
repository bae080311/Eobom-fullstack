import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").optional(),
  phoneNumber: z.string().min(1, "전화번호를 입력해주세요").optional(),
  licenseNumber: z.string().min(1, "면허번호를 입력해주세요").optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
