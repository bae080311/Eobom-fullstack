import { api } from '@/lib/api';
import type { ScheduleResponseDto } from '@eobom/shared';

export async function fetchSchedules(
  token: string,
  from: Date,
  to: Date,
): Promise<ScheduleResponseDto[]> {
  return api
    .get<
      ScheduleResponseDto[]
    >(`/schedules?from=${from.toISOString()}&to=${to.toISOString()}`, { token, cache: 'no-store' })
    .catch(() => []);
}
