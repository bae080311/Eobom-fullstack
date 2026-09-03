import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PageShell, PageTopBar, IconLink, IconArrowLeft, IconCalendar } from '@/shared/ui';
import { fetchMyOrganization, fetchOrganizationMembers } from '@/entities/organization';
import { OrganizationDashboard } from '@/widgets/organization-dashboard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app.owner');
  return { title: t('organizationTitle') };
}

export default async function OrganizationPage() {
  const token = (await cookies()).get('eobom_access')?.value ?? '';
  const [organization, tApp, tAppCommon, t, tWidget] = await Promise.all([
    token ? fetchMyOrganization(token) : Promise.resolve(null),
    getTranslations('app.owner'),
    getTranslations('app.common'),
    getTranslations('entities.organization'),
    getTranslations('widgets.organizationDashboard'),
  ]);
  const members =
    organization && token ? await fetchOrganizationMembers(token, organization.id) : [];

  if (!organization) notFound();

  return (
    <PageShell>
      <PageTopBar
        title={tApp('organizationTitle')}
        subtitle={organization.name}
        back={
          <IconLink label={tAppCommon('back.toMe')} href="/me">
            <IconArrowLeft size={18} />
          </IconLink>
        }
        action={
          <IconLink label={tApp('calendarLinkLabel')} href="/organization/calendar">
            <IconCalendar size={20} />
          </IconLink>
        }
      />
      <OrganizationDashboard
        organization={organization}
        members={members}
        t={t}
        tWidget={tWidget}
      />
    </PageShell>
  );
}
