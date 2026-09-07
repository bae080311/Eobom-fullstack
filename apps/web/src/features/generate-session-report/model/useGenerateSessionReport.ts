'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { tokenStorage } from '@/features/auth/model/tokenStorage';
import { generateSessionReport, sessionReportKeys } from '@/entities/session-report';
import type { SessionReportResponseDto } from '@eobom/shared';

export function useGenerateSessionReport(scheduleId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (memo: string) => {
      const token = tokenStorage.getAccess() ?? '';
      return generateSessionReport(token, scheduleId, { memo });
    },
    onSuccess: (report: SessionReportResponseDto) => {
      // 생성에 최대 30초가 걸리므로 router.refresh()의 왕복을 기다리지 않고 응답을 바로 캐시에 넣는다.
      queryClient.setQueryData(sessionReportKeys.detail(scheduleId), report);
      router.refresh();
    },
  });
}
