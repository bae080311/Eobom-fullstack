'use client';

import { useTranslations } from 'next-intl';
import type { MemberResponseDto } from '@eobom/shared';
import { ConfirmDialog } from '@/shared/ui';
import { useMemberActions } from '../model/useMemberActions';

interface Props {
  orgId: string;
  member: MemberResponseDto;
  isSelf: boolean;
}

export function MemberActions({ orgId, member, isSelf }: Props) {
  const t = useTranslations('features.manageOrganizationMember');
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
        className="rounded-full bg-danger-soft px-3 py-1.5 text-caption font-semibold text-danger-strong border-0 cursor-pointer font-sans"
      >
        {leaveActionLabel}
      </button>

      <ConfirmDialog
        open={roleOpen}
        title={isOwner ? t('revokeDialogTitle') : t('grantDialogTitle')}
        description={isOwner ? t('revokeDialogDescription') : t('grantDialogDescription')}
        confirmLabel={roleActionLabel}
        destructive={isOwner}
        loading={isUpdating}
        onConfirm={confirmRoleChange}
        onCancel={closeRoleDialog}
      />

      <ConfirmDialog
        open={leaveOpen}
        title={isSelf ? t('leaveDialogTitleSelf') : t('leaveDialogTitleOther')}
        description={isSelf ? t('leaveDialogDescriptionSelf') : t('leaveDialogDescriptionOther')}
        confirmLabel={leaveActionLabel}
        destructive
        loading={isLeaving}
        onConfirm={confirmLeave}
        onCancel={closeLeaveDialog}
      />
    </div>
  );
}
