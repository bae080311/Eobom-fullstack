import { api } from '@/lib/api';
import type { ScheduleResponseDto, ScheduleDetailResponseDto } from '@eobom/shared';

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

// 상세는 에러를 삼키지 않는다 — 호출하는 페이지가 throw를 받아 notFound()를 호출한다.
export async function fetchScheduleDetail(
  token: string,
  id: string,
): Promise<ScheduleDetailResponseDto> {
  return api.get<ScheduleDetailResponseDto>(`/schedules/${id}`, { token, cache: 'no-store' });
}
