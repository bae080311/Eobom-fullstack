import { OrgMemberRole } from '@eobom/shared';
import { requireOrgRole } from '@/entities/organization';

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  await requireOrgRole(OrgMemberRole.OWNER, '/dashboard');

  return <>{children}</>;
}
