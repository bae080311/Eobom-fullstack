'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { MemberResponseDto } from '@eobom/shared';
import { useSetPrimaryTherapist } from '@/entities/child';
import { formatOrgMemberRoleLabel } from '@/entities/organization';
import { ApiError } from '@/lib/api';

interface Props {
  open: boolean;
  childId: string;
  currentPrimaryTherapistId: string | null;
  members: MemberResponseDto[];
  onClose: () => void;
}

export function SetPrimaryTherapistForm({
  open,
  childId,
  currentPrimaryTherapistId,
  members,
  onClose,
}: Props) {
  const [selected, setSelected] = useState(currentPrimaryTherapistId ?? '');
  const { mutate, isPending } = useSetPrimaryTherapist();

  useEffect(() => {
    if (open) {
      setSelected(currentPrimaryTherapistId ?? '');
    }
  }, [open, currentPrimaryTherapistId]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    mutate(
      { id: childId, dto: { primaryTherapistId: selected } },
      {
        onSuccess: () => {
          toast.success('담당 치료사가 변경되었습니다');
          onClose();
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : '담당 치료사 변경에 실패했습니다');
        },
      },
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-5 pb-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 flex flex-col gap-4"
      >
        <h2 className="text-title3 font-bold tracking-tighter text-gray-900 m-0">
          담당 치료사 변경
        </h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-500 font-semibold">담당 치료사</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-[10px] border border-gray-200 px-4 py-3 text-body text-gray-900 outline-none focus:border-brand"
          >
            <option value="" disabled>
              선택해주세요
            </option>
            {members.map((member) => (
              <option key={member.therapistProfileId} value={member.therapistProfileId}>
                {member.user.name} ({formatOrgMemberRoleLabel(member.role)})
              </option>
            ))}
          </select>
        </label>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 bg-gray-100 text-gray-900 rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isPending || !selected}
            className="flex-1 bg-brand text-white rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans disabled:opacity-50"
          >
            {isPending ? '저장 중...' : '변경'}
          </button>
        </div>
      </form>
    </div>
  );
}
