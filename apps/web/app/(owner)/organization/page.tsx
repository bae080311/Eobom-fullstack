import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PageShell, PageTopBar, IconLink, IconArrowLeft, IconCalendar } from '@/shared/ui';
import { fetchMyOrganization, fetchOrganizationMembers } from '@/entities/organization';
import { OrganizationDashboard } from '@/widgets/organization-dashboard';

export const metadata: Metadata = { title: '기관 관리' };

export default async function OrganizationPage() {
  const token = (await cookies()).get('eobom_access')?.value ?? '';
  const [organization, t] = await Promise.all([
    token ? fetchMyOrganization(token) : Promise.resolve(null),
    getTranslations('entities.organization'),
  ]);
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
        action={
          <IconLink label="기관 캘린더" href="/organization/calendar">
            <IconCalendar size={20} />
          </IconLink>
        }
      />
      <OrganizationDashboard organization={organization} members={members} t={t} />
    </PageShell>
  );
}
