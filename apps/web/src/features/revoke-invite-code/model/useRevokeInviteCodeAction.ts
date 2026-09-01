'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useRevokeInviteCode } from '@/entities/invite-code';
import { ApiError } from '@/lib/api';

export function useRevokeInviteCodeAction(id: string) {
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
        toast.success('초대코드가 취소되었습니다');
        router.refresh();
      },
      onError: (err) => {
        closeDialog();
        toast.error(err instanceof ApiError ? err.message : '초대코드 취소에 실패했습니다');
      },
    });
  }

  return { open, isPending, openDialog, closeDialog, confirm };
}
