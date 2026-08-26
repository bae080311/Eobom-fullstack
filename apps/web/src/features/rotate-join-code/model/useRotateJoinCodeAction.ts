'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useRotateJoinCode } from '@/entities/organization';
import { ApiError } from '@/lib/api';

export function useRotateJoinCodeAction(orgId: string) {
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
        toast.success('참여 코드가 재발급되었습니다');
        router.refresh();
      },
      onError: (err) => {
        closeDialog();
        toast.error(err instanceof ApiError ? err.message : '참여 코드 재발급에 실패했습니다');
      },
    });
  }

  return { open, isPending, openDialog, closeDialog, confirm };
}
