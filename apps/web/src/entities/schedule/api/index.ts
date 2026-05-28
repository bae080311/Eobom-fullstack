import { api } from '@/lib/api';
import type { ScheduleResponseDto } from '@eobom/shared';

export async function fetchSchedules(token: string): Promise<ScheduleResponseDto[]> {
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  const to = new Date(from);
  to.setDate(to.getDate() + 30);
  to.setHours(23, 59, 59, 999);

  return api
    .get<
      ScheduleResponseDto[]
    >(`/schedules?from=${from.toISOString()}&to=${to.toISOString()}`, { token, cache: 'no-store' })
    .catch(() => []);
}
