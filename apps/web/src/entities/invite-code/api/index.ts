import { api } from '@/lib/api';
import type { InviteCodeResponseDto } from '@eobom/shared';

export async function fetchInviteCodes(token: string): Promise<InviteCodeResponseDto[]> {
  return api
    .get<InviteCodeResponseDto[]>('/invite-codes', { token, cache: 'no-store' })
    .catch(() => []);
}
