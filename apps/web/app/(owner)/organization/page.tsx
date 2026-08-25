import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { PageShell, PageTopBar, IconLink, IconArrowLeft } from '@/shared/ui';
import { fetchMyOrganization, fetchOrganizationMembers } from '@/entities/organization';
import { OrganizationDashboard } from '@/widgets/organization-dashboard';

export const metadata: Metadata = { title: '기관 관리' };

export default async function OrganizationPage() {
  const token = (await cookies()).get('eobom_access')?.value ?? '';
  const organization = token ? await fetchMyOrganization(token) : null;
  const members =
    organization && token ? await fetchOrganizationMembers(token, organization.id) : [];

  if (!organization) notFound();

  return (
    <PageShell>
      <PageTopBar
        title="기관 관리"
        subtitle={organization.name}
        back={
          <IconLink label="내 정보로" href="/me">
            <IconArrowLeft size={18} />
          </IconLink>
        }
      />
      <OrganizationDashboard organization={organization} members={members} />
    </PageShell>
  );
}
