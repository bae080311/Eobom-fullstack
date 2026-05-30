import { api } from '@/lib/api';
import type { UserWithProfile } from '../model/types';

export async function fetchUserMe(token: string): Promise<UserWithProfile | null> {
  return api.get<UserWithProfile>('/users/me', { token, cache: 'no-store' }).catch(() => null);
}
