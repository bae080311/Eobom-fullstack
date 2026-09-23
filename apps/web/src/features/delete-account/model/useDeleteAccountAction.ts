'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { deleteAccountSchema } from '@eobom/shared';
import { tokenStorage } from '@/features/auth';
import { ApiError } from '@/lib/api';
import { useDeleteAccount } from './useDeleteAccount';

/**
 * 탈퇴 다이얼로그의 상태·검증·후처리를 모은다.
 *
 * 성공하면 서버가 계정을 익명화했으므로 남은 토큰은 이미 무효다(다음 요청에서
 * 401). 화면에 남겨두면 401 화면을 보게 되므로 즉시 비우고 로그인으로 보낸다.
 */
export function useDeleteAccountAction() {
  const t = useTranslations('features.deleteAccount');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { mutate, isPending } = useDeleteAccount();

  function openDialog() {
    setPassword('');
    setError(null);
    setOpen(true);
  }

  function closeDialog() {
    if (isPending) return;
    setOpen(false);
  }

  function changePassword(value: string) {
    setPassword(value);
    if (error) setError(null);
  }

  function submit() {
    const parsed = deleteAccountSchema.safeParse({ password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('passwordRequired'));
      return;
    }

    mutate(parsed.data, {
      onSuccess: () => {
        setOpen(false);
        tokenStorage.clear();
        toast.success(t('deleteSuccess'));
        router.replace('/login');
      },
      onError: (err) => {
        setError(err instanceof ApiError ? err.message : t('deleteError'));
      },
    });
  }

  return { open, password, error, isPending, openDialog, closeDialog, changePassword, submit };
}
