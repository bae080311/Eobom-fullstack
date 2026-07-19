'use client';

import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { tokenStorage } from '@/features/auth/model/tokenStorage';
import type { CreateChildDto, UpdateChildDto, ChildResponseDto } from '@eobom/shared';

export const childKeys = {
  all: ['children'] as const,
};

export function useCreateChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateChildDto) => {
      const token = tokenStorage.getAccess() ?? '';
      return api.post<ChildResponseDto>('/children', dto, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: childKeys.all });
    },
  });
}

export function useUpdateChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateChildDto }) => {
      const token = tokenStorage.getAccess() ?? '';
      return api.put<ChildResponseDto>(`/children/${id}`, dto, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: childKeys.all });
    },
  });
}

export function useDeleteChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const token = tokenStorage.getAccess() ?? '';
      return api.delete<void>(`/children/${id}`, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: childKeys.all });
    },
  });
}
