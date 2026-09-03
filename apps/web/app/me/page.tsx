import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { OrgMemberRole } from '@eobom/shared';
import { PageShell } from '@/shared/ui';
import { fetchUserMe } from '@/entities/user';
import { fetchMyOrganization } from '@/entities/organization';
import { MyInfoView } from '@/widgets/my-info';
import { ParentTabBar } from '@/widgets/parent-tab-bar';
import { TherapistTabBar } from '@/widgets/therapist-tab-bar';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app.common');
  return { title: t('myInfoTitle') };
}

export default async function MyInfoPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';
  const [user, organization] = token
    ? await Promise.all([fetchUserMe(token), fetchMyOrganization(token)])
    : [null, null];

  if (!user) redirect('/login');

  const isOwner = organization?.membership.role === OrgMemberRole.OWNER;

  return (
    <PageShell>
      <MyInfoView user={user} isOwner={isOwner} />
      {user.role === 'PARENT' ? <ParentTabBar active="me" /> : <TherapistTabBar active="me" />}
    </PageShell>
  );
}
