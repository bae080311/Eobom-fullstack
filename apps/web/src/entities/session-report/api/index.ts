import { api } from '@/lib/api';
import type { GenerateReportDto, SessionReportResponseDto } from '@eobom/shared';

// report 모듈만 레이어 5 §5.1의 `{ data: ... }` 엔벨로프를 그대로 지키고 있다 —
// schedules·notifications 등 다른 모듈은 DTO를 그대로 돌려주고, 전역 인터셉터도 없다.
// 서버 계약을 바꾸는 건 이 작업 범위 밖이라 여기서 벗겨낸다.
interface ReportEnvelope<T> {
  data: T;
}

// 리포트가 아직 없으면 404가 아니라 data: null이 온다.
// 조회 실패는 페이지를 죽이지 않고 빈 상태로 흡수한다 (레이어 6 §6.3 목록 조회 규칙과 동일).
export async function fetchSessionReport(
  token: string,
  scheduleId: string,
): Promise<SessionReportResponseDto | null> {
  return api
    .get<ReportEnvelope<SessionReportResponseDto | null>>(`/schedules/${scheduleId}/report`, {
      token,
      cache: 'no-store',
    })
    .then((res) => res.data)
    .catch(() => null);
}

export async function generateSessionReport(
  token: string,
  scheduleId: string,
  dto: GenerateReportDto,
): Promise<SessionReportResponseDto> {
  const res = await api.post<ReportEnvelope<SessionReportResponseDto>>(
    `/schedules/${scheduleId}/report/generate`,
    dto,
    { token },
  );
  return res.data;
}
