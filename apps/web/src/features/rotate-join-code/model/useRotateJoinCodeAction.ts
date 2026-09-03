'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRotateJoinCode } from '@/entities/organization';
import { ApiError } from '@/lib/api';

export function useRotateJoinCodeAction(orgId: string) {
  const t = useTranslations('features.rotateJoinCode');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useRotateJoinCode(orgId);

  function openDialog() {
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
  }

  function confirm() {
    mutate(undefined, {
      onSuccess: () => {
        closeDialog();
        toast.success(t('rotateSuccess'));
        router.refresh();
      },
      onError: (err) => {
        closeDialog();
        toast.error(err instanceof ApiError ? err.message : t('rotateError'));
      },
    });
  }

  return { open, isPending, openDialog, closeDialog, confirm };
}
