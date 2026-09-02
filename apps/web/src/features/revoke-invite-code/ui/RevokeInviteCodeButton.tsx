'use client';

import { ConfirmDialog } from '@/shared/ui';
import { useRevokeInviteCodeAction } from '../model/useRevokeInviteCodeAction';

interface Props {
  id: string;
}

export function RevokeInviteCodeButton({ id }: Props) {
  const { open, isPending, openDialog, closeDialog, confirm } = useRevokeInviteCodeAction(id);

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-full bg-danger-soft px-3 py-1.5 text-caption font-semibold text-danger-strong border-0 cursor-pointer font-sans"
      >
        취소
      </button>

      <ConfirmDialog
        open={open}
        title="초대코드를 취소하시겠어요?"
        description="취소된 코드는 더 이상 사용할 수 없습니다."
        confirmLabel="취소하기"
        destructive
        loading={isPending}
        onConfirm={confirm}
        onCancel={closeDialog}
      />
    </>
  );
}
