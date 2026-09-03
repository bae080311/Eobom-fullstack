import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { PageShell, PageTopBar, IconLink, IconFileText } from '@/shared/ui';
import { fetchChildren, ChildList } from '@/entities/child';
import { TherapistTabBar } from '@/widgets/therapist-tab-bar';
import { CreateChildButton } from '@/features/create-child';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app.therapist');
  return { title: t('childrenTitle') };
}

export default async function TherapistChildrenPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  const [children, tApp, t] = await Promise.all([
    token ? fetchChildren(token) : Promise.resolve([]),
    getTranslations('app.therapist'),
    getTranslations('entities.child'),
  ]);

  return (
    <PageShell>
      <PageTopBar
        title={tApp('childrenTitle')}
        subtitle={tApp('childrenCount', { count: children.length })}
        action={
          <div className="flex items-center gap-2">
            <IconLink label={tApp('inviteCodesLinkLabel')} href="/invite-codes">
              <IconFileText size={18} />
            </IconLink>
            <CreateChildButton />
          </div>
        }
      />
      <ChildList items={children} t={t} />
      <TherapistTabBar active="children" />
    </PageShell>
  );
}
