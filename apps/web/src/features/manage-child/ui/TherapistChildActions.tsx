'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeleteChild } from '@/entities/child';
import { ConfirmDialog, IconRefresh } from '@/shared/ui';
import { ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { EditChildForm } from './EditChildForm';

interface Props {
  childId: string;
  name: string;
  birthDate: string | null;
  memo: string | null;
}

export function TherapistChildActions({ childId, name, birthDate, memo }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { mutate: deleteChild, isPending: isDeleting } = useDeleteChild();

  function handleDelete() {
    deleteChild(childId, {
      onSuccess: () => {
        toast.success('아동이 삭제되었습니다');
        router.push('/children');
      },
      onError: (err) => {
        setDeleteOpen(false);
        toast.error(err instanceof ApiError ? err.message : '아동 삭제에 실패했습니다');
      },
    });
  }

  return (
    <div className="fixed bottom-0 inset-x-0 px-5 py-3 pb-[30px] bg-white/90 backdrop-blur-xl border-t border-gray-200 flex gap-2 z-50">
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="flex-1 bg-gray-100 text-gray-900 rounded-[10px] py-3 px-4 font-bold text-callout inline-flex items-center justify-center gap-2 border-0 cursor-pointer font-sans"
      >
        <IconRefresh size={16} /> 수정
      </button>

      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        className="flex-1 bg-danger-soft text-danger rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans"
      >
        삭제
      </button>

      <ConfirmDialog
        open={deleteOpen}
        title="아동을 삭제하시겠어요?"
        description="연결된 일정·초대코드가 모두 함께 삭제되며 되돌릴 수 없습니다."
        confirmLabel="삭제하기"
        destructive
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <EditChildForm
        open={editOpen}
        childId={childId}
        name={name}
        birthDate={birthDate}
        memo={memo}
        onClose={() => {
          setEditOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
