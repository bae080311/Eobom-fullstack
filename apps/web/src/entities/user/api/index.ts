import { api } from '@/lib/api';
import type { DeleteAccountDto, UpdateProfileDto } from '@eobom/shared';
import type { UserWithProfile } from '../model/types';

export async function fetchUserMe(token: string): Promise<UserWithProfile | null> {
  return api.get<UserWithProfile>('/users/me', { token, cache: 'no-store' }).catch(() => null);
}

export async function updateMyProfile(
  token: string,
  dto: UpdateProfileDto,
): Promise<UserWithProfile> {
  return api.patch<UserWithProfile>('/users/me', dto, { token });
}

/**
 * 계정 삭제. 되돌릴 수 없으므로 서버가 비밀번호를 다시 확인한다 — 본문이 필요해
 * DELETE에 `json`을 실어 보낸다(ky가 그대로 통과시킨다). 응답은 204다.
 */
export async function deleteMyAccount(token: string, dto: DeleteAccountDto): Promise<void> {
  return api.delete<void>('/users/me', { token, json: dto });
}
