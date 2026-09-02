import { z } from 'zod';
import { ParentRelation } from '@eobom/shared';

export const redeemFormSchema = z.object({
  code: z.string().min(1, '초대 코드를 입력해주세요'),
  relation: z.nativeEnum(ParentRelation),
});

export type RedeemFormData = z.infer<typeof redeemFormSchema>;

export const RELATION_LABEL: Record<ParentRelation, string> = {
  [ParentRelation.MOTHER]: '어머니',
  [ParentRelation.FATHER]: '아버지',
  [ParentRelation.GUARDIAN]: '보호자',
  [ParentRelation.OTHER]: '기타',
};
