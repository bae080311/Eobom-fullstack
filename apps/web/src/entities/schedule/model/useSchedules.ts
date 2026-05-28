'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { tokenStorage } from '@/features/auth/model/tokenStorage';
import { fetchSchedules } from '../api/index';
import type { CreateScheduleDto, UpdateScheduleDto, ScheduleResponseDto } from '@eobom/shared';

export const scheduleKeys = {
  all: ['schedules'] as const,
  month: (year: number, month: number) => ['schedules', year, month] as const,
};

export function useSchedules(year: number, month: number, initialData?: ScheduleResponseDto[]) {
  return useQuery({
    queryKey: scheduleKeys.month(year, month),
    queryFn: () => {
      const token = tokenStorage.getAccess() ?? '';
      const from = new Date(year, month, 1, 0, 0, 0, 0);
      const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return fetchSchedules(token, from, to);
    },
    initialData,
    staleTime: 30_000,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateScheduleDto) => {
      const token = tokenStorage.getAccess() ?? '';
      return api.post<ScheduleResponseDto>('/schedules', dto, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateScheduleDto }) => {
      const token = tokenStorage.getAccess() ?? '';
      return api.put<ScheduleResponseDto>(`/schedules/${id}`, dto, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useCancelSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const token = tokenStorage.getAccess() ?? '';
      return api.delete<ScheduleResponseDto>(`/schedules/${id}`, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useConfirmSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const token = tokenStorage.getAccess() ?? '';
      return api.post<ScheduleResponseDto>(`/schedules/${id}/confirm`, {}, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}
