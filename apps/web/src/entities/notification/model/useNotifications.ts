'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tokenStorage } from '@/features/auth/model/tokenStorage';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../api/index';
import type { NotificationResponseDto } from '@eobom/shared';

export const notificationKeys = {
  all: ['notifications'] as const,
};

export function useNotifications(initialData?: NotificationResponseDto[]) {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => {
      const token = tokenStorage.getAccess() ?? '';
      return fetchNotifications(token);
    },
    initialData,
    staleTime: 30_000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const token = tokenStorage.getAccess() ?? '';
      return markNotificationRead(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      const token = tokenStorage.getAccess() ?? '';
      return markAllNotificationsRead(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
