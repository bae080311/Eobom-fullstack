'use client';

import { useQuery } from '@tanstack/react-query';
import { tokenStorage } from '@/features/auth/model/tokenStorage';
import { fetchSessionReport } from '../api/index';
import type { SessionReportResponseDto } from '@eobom/shared';

export const sessionReportKeys = {
  all: ['session-reports'] as const,
  detail: (scheduleId: string) => ['session-reports', scheduleId] as const,
};

// RSC가 조회한 결과를 initialData로 주입받는다 (레이어 6 §6.3).
// 리포트가 없을 때 값이 null이라 initialData가 undefined와 구분된다.
export function useSessionReport(scheduleId: string, initialData: SessionReportResponseDto | null) {
  return useQuery({
    queryKey: sessionReportKeys.detail(scheduleId),
    queryFn: () => {
      const token = tokenStorage.getAccess() ?? '';
      return fetchSessionReport(token, scheduleId);
    },
    initialData,
    staleTime: 30_000,
  });
}
