import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OrgMemberRole } from '@eobom/shared';
import { fetchMyOrganization } from '@/entities/organization';

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get('eobom_access')?.value ?? '';
  const organization = token ? await fetchMyOrganization(token) : null;

  if (!organization || organization.membership.role !== OrgMemberRole.OWNER) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
