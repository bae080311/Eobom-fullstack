import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageShell } from '@/shared/ui';
import { fetchUserMe } from '@/entities/user';
import { MyInfoView } from '@/widgets/my-info';
import { ParentTabBar } from '@/widgets/parent-tab-bar';
import { TherapistTabBar } from '@/widgets/therapist-tab-bar';

export const metadata: Metadata = { title: '내 정보' };

export default async function MyInfoPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';
  const user = token ? await fetchUserMe(token) : null;

  if (!user) redirect('/login');

  return (
    <PageShell>
      <MyInfoView user={user} />
      {user.role === 'PARENT' ? <ParentTabBar active="me" /> : <TherapistTabBar active="me" />}
    </PageShell>
  );
}
