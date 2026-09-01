import { redirect } from 'next/navigation';
import type { OrgMemberRole, OrganizationResponseDto } from '@eobom/shared';

export function assertOrgRole(
  organization: OrganizationResponseDto | null,
  role: OrgMemberRole,
  fallbackPath: string,
): OrganizationResponseDto {
  if (!organization || organization.membership.role !== role) {
    redirect(fallbackPath);
  }

  return organization;
}
