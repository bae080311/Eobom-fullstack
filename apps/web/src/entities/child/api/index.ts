import { api } from '@/lib/api';
import type { ChildResponseDto } from '@eobom/shared';

export async function fetchChildren(token: string): Promise<ChildResponseDto[]> {
  return api.get<ChildResponseDto[]>('/children', { token, cache: 'no-store' }).catch(() => []);
}
