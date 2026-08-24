'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useRotateJoinCode } from '@/entities/organization';
import { ConfirmDialog, IconRefresh } from '@/shared/ui';
import { ApiError } from '@/lib/api';

interface Props {
  orgId: string;
}

export function RotateJoinCodeButton({ orgId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useRotateJoinCode(orgId);

  function handleConfirm() {
    mutate(undefined, {
      onSuccess: () => {
        setOpen(false);
        toast.success('참여 코드가 재발급되었습니다');
        router.refresh();
      },
      onError: (err) => {
        setOpen(false);
        toast.error(err instanceof ApiError ? err.message : '참여 코드 재발급에 실패했습니다');
      },
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-caption font-semibold text-gray-700 border-0 cursor-pointer font-sans"
      >
        <IconRefresh size={14} /> 재발급
      </button>

      <ConfirmDialog
        open={open}
        title="참여 코드를 재발급하시겠어요?"
        description="기존 코드는 즉시 무효화되며, 이 코드로 가입을 준비 중인 치료사가 있다면 새 코드를 다시 공유해야 합니다."
        confirmLabel="재발급"
        destructive
        loading={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
