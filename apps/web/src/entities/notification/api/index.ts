import { api } from '@/lib/api';
import type { NotificationResponseDto } from '@eobom/shared';

export async function fetchNotifications(token: string): Promise<NotificationResponseDto[]> {
  return api
    .get<NotificationResponseDto[]>('/notifications', { token, cache: 'no-store' })
    .catch(() => []);
}

export async function markNotificationRead(
  token: string,
  id: string,
): Promise<NotificationResponseDto> {
  return api.patch<NotificationResponseDto>(`/notifications/${id}/read`, {}, { token });
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  return api.patch<void>('/notifications/read-all', {}, { token });
}
