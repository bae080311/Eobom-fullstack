'use client';

import { useQuery } from '@tanstack/react-query';
import { tokenStorage } from '@/features/auth/model/tokenStorage';
import { getKSTStartOfDay, getKSTWeekStart, toKSTDateString } from '@/shared/lib/date';
import { fetchSchedules } from '../api/index';
import { scheduleKeys } from './useSchedules';
import type { ScheduleResponseDto } from '@eobom/shared';

export function useTodaySchedules(initialData?: ScheduleResponseDto[]) {
  const todayStart = getKSTStartOfDay();
  const dateStr = toKSTDateString(todayStart);

  return useQuery({
    queryKey: scheduleKeys.today(dateStr),
    queryFn: () => {
      const token = tokenStorage.getAccess() ?? '';
      const from = todayStart;
      const to = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      return fetchSchedules(token, from, to);
    },
    initialData,
    staleTime: 30_000,
  });
}

export function useWeekSchedules(initialData?: ScheduleResponseDto[]) {
  const weekStart = getKSTWeekStart();
  const weekStartStr = toKSTDateString(weekStart);

  return useQuery({
    queryKey: scheduleKeys.week(weekStartStr),
    queryFn: () => {
      const token = tokenStorage.getAccess() ?? '';
      const from = weekStart;
      const to = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      return fetchSchedules(token, from, to);
    },
    initialData,
    staleTime: 30_000,
  });
}
