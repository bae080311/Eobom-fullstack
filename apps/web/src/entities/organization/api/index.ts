import { api } from '@/lib/api';
import type { OrganizationResponseDto, MemberResponseDto } from '@eobom/shared';

export async function fetchMyOrganization(token: string): Promise<OrganizationResponseDto | null> {
  return api
    .get<OrganizationResponseDto>('/organizations/me', { token, cache: 'no-store' })
    .catch(() => null);
}

export async function fetchOrganizationMembers(
  token: string,
  orgId: string,
): Promise<MemberResponseDto[]> {
  return api
    .get<MemberResponseDto[]>(`/organizations/${orgId}/members`, { token, cache: 'no-store' })
    .catch(() => []);
}
