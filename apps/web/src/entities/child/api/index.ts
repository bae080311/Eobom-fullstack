import { api } from '@/lib/api';
import type { ChildResponseDto } from '@eobom/shared';

export async function fetchChildren(token: string): Promise<ChildResponseDto[]> {
  return api.get<ChildResponseDto[]>('/children', { token, cache: 'no-store' }).catch(() => []);
}

// 상세는 에러를 삼키지 않는다 — 호출하는 페이지가 throw를 받아 notFound()를 호출한다.
export async function fetchChildDetail(token: string, id: string): Promise<ChildResponseDto> {
  return api.get<ChildResponseDto>(`/children/${id}`, { token, cache: 'no-store' });
}
