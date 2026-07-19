import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { PageShell, PageTopBar } from '@/shared/ui';
import { fetchChildren, ChildList } from '@/entities/child';
import { TherapistTabBar } from '@/widgets/therapist-tab-bar';
import { CreateChildButton } from '@/features/create-child';

export const metadata: Metadata = { title: '담당 아동' };

export default async function TherapistChildrenPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  const children = token ? await fetchChildren(token) : [];

  return (
    <PageShell>
      <PageTopBar
        title="담당 아동"
        subtitle={`${children.length}명`}
        action={<CreateChildButton />}
      />
      <ChildList items={children} />
      <TherapistTabBar active="children" />
    </PageShell>
  );
}
