import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { PageShell, PageTopBar, IconLink, IconFileText } from '@/shared/ui';
import { fetchChildren, ChildList } from '@/entities/child';
import { TherapistTabBar } from '@/widgets/therapist-tab-bar';
import { CreateChildButton } from '@/features/create-child';

export const metadata: Metadata = { title: '담당 아동' };

export default async function TherapistChildrenPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  const [children, t] = await Promise.all([
    token ? fetchChildren(token) : Promise.resolve([]),
    getTranslations('entities.child'),
  ]);

  return (
    <PageShell>
      <PageTopBar
        title="담당 아동"
        subtitle={`${children.length}명`}
        action={
          <div className="flex items-center gap-2">
            <IconLink label="발급 코드" href="/invite-codes">
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
