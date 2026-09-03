'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { OrgMemberRole, type MemberResponseDto } from '@eobom/shared';
import { useUpdateMember, useLeaveMember } from '@/entities/organization';
import { ApiError } from '@/lib/api';

export function useMemberActions(orgId: string, member: MemberResponseDto, isSelf: boolean) {
  const t = useTranslations('features.manageOrganizationMember');
  const router = useRouter();
  const [roleOpen, setRoleOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const { mutate: updateMember, isPending: isUpdating } = useUpdateMember(orgId);
  const { mutate: leaveMember, isPending: isLeaving } = useLeaveMember(orgId);

  const isOwner = member.role === OrgMemberRole.OWNER;
  const nextRole = isOwner ? OrgMemberRole.THERAPIST : OrgMemberRole.OWNER;
  const roleActionLabel = isOwner ? t('roleActionRevokeOwner') : t('roleActionGrantOwner');
  const leaveActionLabel = isSelf ? t('leaveActionSelf') : t('leaveActionOther');

  function openRoleDialog() {
    setRoleOpen(true);
  }

  function closeRoleDialog() {
    setRoleOpen(false);
  }

  function openLeaveDialog() {
    setLeaveOpen(true);
  }

  function closeLeaveDialog() {
    setLeaveOpen(false);
  }

  function confirmRoleChange() {
    updateMember(
      { membershipId: member.id, dto: { role: nextRole } },
      {
        onSuccess: () => {
          closeRoleDialog();
          toast.success(t('roleUpdateSuccess'));
          router.refresh();
        },
        onError: (err) => {
          closeRoleDialog();
          toast.error(err instanceof ApiError ? err.message : t('roleUpdateError'));
        },
      },
    );
  }

  function confirmLeave() {
    leaveMember(member.id, {
      onSuccess: () => {
        closeLeaveDialog();
        toast.success(isSelf ? t('leaveSuccessSelf') : t('leaveSuccessOther'));
        router.refresh();
      },
      onError: (err) => {
        closeLeaveDialog();
        toast.error(err instanceof ApiError ? err.message : t('leaveError'));
      },
    });
  }

  return {
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
  };
}
