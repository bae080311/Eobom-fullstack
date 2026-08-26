'use client';

import { ConfirmDialog, IconRefresh } from '@/shared/ui';
import { useRotateJoinCodeAction } from '../model/useRotateJoinCodeAction';

interface Props {
  orgId: string;
}

export function RotateJoinCodeButton({ orgId }: Props) {
  const { open, isPending, openDialog, closeDialog, confirm } = useRotateJoinCodeAction(orgId);

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
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
        onConfirm={confirm}
        onCancel={closeDialog}
      />
    </>
  );
}
