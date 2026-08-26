import { cache } from 'react';
import { api } from '@/lib/api';
import type { OrganizationResponseDto, MemberResponseDto } from '@eobom/shared';

// (owner)/layout.tsx와 organization/page.tsx가 같은 요청 안에서 각각 호출하므로,
// react cache로 감싸 /organizations/me 중복 호출을 요청당 1회로 줄인다.
export const fetchMyOrganization = cache(
  async (token: string): Promise<OrganizationResponseDto | null> => {
    return api
      .get<OrganizationResponseDto>('/organizations/me', { token, cache: 'no-store' })
      .catch(() => null);
  },
);

export async function fetchOrganizationMembers(
  token: string,
  orgId: string,
): Promise<MemberResponseDto[]> {
  return api
    .get<MemberResponseDto[]>(`/organizations/${orgId}/members`, { token, cache: 'no-store' })
    .catch(() => []);
}
