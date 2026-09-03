'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSetPrimaryTherapist } from '@/entities/child';
import { ApiError } from '@/lib/api';

export function useSetPrimaryTherapistAction(childId: string, onSuccess: () => void) {
  const t = useTranslations('features.manageChild.primaryTherapistForm');
  const { mutate, isPending } = useSetPrimaryTherapist();

  function submit(primaryTherapistId: string) {
    mutate(
      { id: childId, dto: { primaryTherapistId } },
      {
        onSuccess: () => {
          toast.success(t('updateSuccess'));
          onSuccess();
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : t('updateError'));
        },
      },
    );
  }

  return { submit, isPending };
}
