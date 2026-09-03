import { z } from 'zod';
import { ParentRelation } from '@eobom/shared';
import type { Translate } from '@/shared/lib/i18n';

export function createRedeemFormSchema(t: Translate) {
  return z.object({
    code: z.string().min(1, t('codeRequired')),
    relation: z.nativeEnum(ParentRelation),
  });
}

export type RedeemFormData = z.infer<ReturnType<typeof createRedeemFormSchema>>;
