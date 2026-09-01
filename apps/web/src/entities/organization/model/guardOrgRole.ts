import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { OrgMemberRole, OrganizationResponseDto } from '@eobom/shared';
import { fetchMyOrganization } from '../api/index';

export async function requireOrgRole(
  role: OrgMemberRole,
  fallbackPath: string,
): Promise<OrganizationResponseDto> {
  const token = (await cookies()).get('eobom_access')?.value ?? '';
  const organization = token ? await fetchMyOrganization(token) : null;

  if (!organization || organization.membership.role !== role) {
    redirect(fallbackPath);
  }

  return organization;
}
