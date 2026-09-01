import { cookies } from 'next/headers';
import { OrgMemberRole } from '@eobom/shared';
import { assertOrgRole, fetchMyOrganization } from '@/entities/organization';

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get('eobom_access')?.value ?? '';
  const organization = token ? await fetchMyOrganization(token) : null;
  assertOrgRole(organization, OrgMemberRole.OWNER, '/dashboard');

  return <>{children}</>;
}
