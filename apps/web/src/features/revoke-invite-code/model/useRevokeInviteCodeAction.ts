'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRevokeInviteCode } from '@/entities/invite-code';
import { ApiError } from '@/lib/api';

export function useRevokeInviteCodeAction(id: string) {
  const t = useTranslations('features.revokeInviteCode');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useRevokeInviteCode();

  function openDialog() {
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
  }

  function confirm() {
    mutate(id, {
      onSuccess: () => {
        closeDialog();
        toast.success(t('revokeSuccess'));
        router.refresh();
      },
      onError: (err) => {
        closeDialog();
        toast.error(err instanceof ApiError ? err.message : t('revokeError'));
      },
    });
  }

  return { open, isPending, openDialog, closeDialog, confirm };
}
