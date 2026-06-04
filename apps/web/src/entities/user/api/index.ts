import { api } from '@/lib/api';
import type { UpdateProfileDto } from '@eobom/shared';
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
