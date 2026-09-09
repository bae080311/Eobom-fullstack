import { api } from '@/lib/api';
import type { GenerateReportDto, SessionReportResponseDto } from '@eobom/shared';

// 엔벨로프(`{ data: ... }`) 언랩은 `@/lib/api`가 한 군데서 처리한다 —
// 이전엔 report 모듈만 엔벨로프를 지켜서 여기서 손으로 벗겼다.

// 리포트가 아직 없으면 404가 아니라 null이 온다.
// 조회 실패는 페이지를 죽이지 않고 빈 상태로 흡수한다 (레이어 6 §6.3 목록 조회 규칙과 동일).
export async function fetchSessionReport(
  token: string,
  scheduleId: string,
): Promise<SessionReportResponseDto | null> {
  return api
    .get<SessionReportResponseDto | null>(`/schedules/${scheduleId}/report`, {
      token,
      cache: 'no-store',
    })
    .catch(() => null);
}

export async function generateSessionReport(
  token: string,
  scheduleId: string,
  dto: GenerateReportDto,
): Promise<SessionReportResponseDto> {
  return api.post<SessionReportResponseDto>(`/schedules/${scheduleId}/report/generate`, dto, {
    token,
  });
}
