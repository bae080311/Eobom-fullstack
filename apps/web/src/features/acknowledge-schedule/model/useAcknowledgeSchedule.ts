'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { tokenStorage } from '@/features/auth/model/tokenStorage';
import { scheduleKeys } from '@/entities/schedule';
import type { ScheduleDetailResponseDto } from '@eobom/shared';

export function useAcknowledgeSchedule() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => {
      const token = tokenStorage.getAccess() ?? '';
      return api.post<ScheduleDetailResponseDto>(`/schedules/${id}/acknowledge`, {}, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      router.refresh();
    },
  });
}
