'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { OrgMemberRole, type MemberResponseDto } from '@eobom/shared';
import { useUpdateMember, useLeaveMember } from '@/entities/organization';
import { ApiError } from '@/lib/api';

export function useMemberActions(orgId: string, member: MemberResponseDto, isSelf: boolean) {
  const router = useRouter();
  const [roleOpen, setRoleOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const { mutate: updateMember, isPending: isUpdating } = useUpdateMember(orgId);
  const { mutate: leaveMember, isPending: isLeaving } = useLeaveMember(orgId);

  const isOwner = member.role === OrgMemberRole.OWNER;
  const nextRole = isOwner ? OrgMemberRole.THERAPIST : OrgMemberRole.OWNER;
  const roleActionLabel = isOwner ? '치료사로 변경' : '소유자로 지정';
  const leaveActionLabel = isSelf ? '탈퇴' : '내보내기';

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
          toast.success('멤버 역할이 변경되었습니다');
          router.refresh();
        },
        onError: (err) => {
          closeRoleDialog();
          toast.error(err instanceof ApiError ? err.message : '역할 변경에 실패했습니다');
        },
      },
    );
  }

  function confirmLeave() {
    leaveMember(member.id, {
      onSuccess: () => {
        closeLeaveDialog();
        toast.success(isSelf ? '기관에서 탈퇴했습니다' : '멤버를 내보냈습니다');
        router.refresh();
      },
      onError: (err) => {
        closeLeaveDialog();
        toast.error(err instanceof ApiError ? err.message : '처리에 실패했습니다');
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
