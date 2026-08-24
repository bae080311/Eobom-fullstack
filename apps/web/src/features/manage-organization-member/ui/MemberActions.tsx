'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { OrgMemberRole, type MemberResponseDto } from '@eobom/shared';
import { useUpdateMember, useLeaveMember } from '@/entities/organization';
import { ConfirmDialog } from '@/shared/ui';
import { ApiError } from '@/lib/api';

interface Props {
  orgId: string;
  member: MemberResponseDto;
  isSelf: boolean;
}

export function MemberActions({ orgId, member, isSelf }: Props) {
  const router = useRouter();
  const [roleOpen, setRoleOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const { mutate: updateMember, isPending: isUpdating } = useUpdateMember(orgId);
  const { mutate: leaveMember, isPending: isLeaving } = useLeaveMember(orgId);

  const isOwner = member.role === OrgMemberRole.OWNER;
  const nextRole = isOwner ? OrgMemberRole.THERAPIST : OrgMemberRole.OWNER;
  const roleActionLabel = isOwner ? '치료사로 변경' : '소유자로 지정';
  const leaveActionLabel = isSelf ? '탈퇴' : '내보내기';

  function handleRoleChange() {
    updateMember(
      { membershipId: member.id, dto: { role: nextRole } },
      {
        onSuccess: () => {
          setRoleOpen(false);
          toast.success('멤버 역할이 변경되었습니다');
          router.refresh();
        },
        onError: (err) => {
          setRoleOpen(false);
          toast.error(err instanceof ApiError ? err.message : '역할 변경에 실패했습니다');
        },
      },
    );
  }

  function handleLeave() {
    leaveMember(member.id, {
      onSuccess: () => {
        setLeaveOpen(false);
        toast.success(isSelf ? '기관에서 탈퇴했습니다' : '멤버를 내보냈습니다');
        router.refresh();
      },
      onError: (err) => {
        setLeaveOpen(false);
        toast.error(err instanceof ApiError ? err.message : '처리에 실패했습니다');
      },
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setRoleOpen(true)}
        className="rounded-full bg-gray-100 px-3 py-1.5 text-caption font-semibold text-gray-700 border-0 cursor-pointer font-sans"
      >
        {roleActionLabel}
      </button>
      <button
        type="button"
        onClick={() => setLeaveOpen(true)}
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
        onConfirm={handleRoleChange}
        onCancel={() => setRoleOpen(false)}
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
        onConfirm={handleLeave}
        onCancel={() => setLeaveOpen(false)}
      />
    </div>
  );
}
