import { z } from "zod";

export const createChildSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  birthDate: z.string().date("올바른 생년월일 형식이 아닙니다").optional(),
  memo: z.string().optional(),
  primaryTherapistId: z.string().nullable().optional(),
});

export type CreateChildDto = z.infer<typeof createChildSchema>;

export const updateChildSchema = createChildSchema
  .omit({ primaryTherapistId: true })
  .partial();

export type UpdateChildDto = z.infer<typeof updateChildSchema>;

export const setPrimaryTherapistSchema = z.object({
  primaryTherapistId: z.string().min(1, "담당 치료사를 선택해주세요"),
});

export type SetPrimaryTherapistDto = z.infer<typeof setPrimaryTherapistSchema>;

export interface ChildResponseDto {
  id: string;
  name: string;
  birthDate: string | null;
  memo: string | null;
  nextSessionAt: string | null;
}
