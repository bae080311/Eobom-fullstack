'use client';

import { toast } from 'sonner';
import { useSetPrimaryTherapist } from '@/entities/child';
import { ApiError } from '@/lib/api';

export function useSetPrimaryTherapistAction(childId: string, onSuccess: () => void) {
  const { mutate, isPending } = useSetPrimaryTherapist();

  function submit(primaryTherapistId: string) {
    mutate(
      { id: childId, dto: { primaryTherapistId } },
      {
        onSuccess: () => {
          toast.success('담당 치료사가 변경되었습니다');
          onSuccess();
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : '담당 치료사 변경에 실패했습니다');
        },
      },
    );
  }

  return { submit, isPending };
}
