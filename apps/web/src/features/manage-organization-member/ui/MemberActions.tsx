'use client';

import type { MemberResponseDto } from '@eobom/shared';
import { ConfirmDialog } from '@/shared/ui';
import { useMemberActions } from '../model/useMemberActions';

interface Props {
  orgId: string;
  member: MemberResponseDto;
  isSelf: boolean;
}

export function MemberActions({ orgId, member, isSelf }: Props) {
  const {
    isOwner,
    roleActionLabel,
    leaveActionLabel,
    roleOpen,
    leaveOpen,
    isUpdating,
    isLeaving,
    openRoleDialog,
    closeRoleDialog,
    openLeaveDialog,
    closeLeaveDialog,
    confirmRoleChange,
    confirmLeave,
  } = useMemberActions(orgId, member, isSelf);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={openRoleDialog}
        className="rounded-full bg-gray-100 px-3 py-1.5 text-caption font-semibold text-gray-700 border-0 cursor-pointer font-sans"
      >
        {roleActionLabel}
      </button>
      <button
        type="button"
        onClick={openLeaveDialog}
        className="rounded-full bg-danger-soft px-3 py-1.5 text-caption font-semibold text-danger border-0 cursor-pointer font-sans"
      >
        {leaveActionLabel}
      </button>

      <ConfirmDialog
        open={roleOpen}
        title={isOwner ? '소유자 권한을 해제하시겠어요?' : '소유자로 지정하시겠어요?'}
        description={
          isOwner
            ? '이 멤버는 더 이상 기관 정보·멤버를 관리할 수 없게 됩니다.'
            : '이 멤버가 기관 정보·멤버를 관리할 수 있게 됩니다.'
        }
        confirmLabel={roleActionLabel}
        destructive={isOwner}
        loading={isUpdating}
        onConfirm={confirmRoleChange}
        onCancel={closeRoleDialog}
      />

      <ConfirmDialog
        open={leaveOpen}
        title={isSelf ? '기관에서 탈퇴하시겠어요?' : '이 멤버를 내보내시겠어요?'}
        description={
          isSelf
            ? '탈퇴 후에는 다시 참여 코드로 가입해야 합니다.'
            : '내보낸 멤버는 참여 코드로 다시 가입할 수 있습니다.'
        }
        confirmLabel={leaveActionLabel}
        destructive
        loading={isLeaving}
        onConfirm={confirmLeave}
        onCancel={closeLeaveDialog}
      />
    </div>
  );
}
