import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { PageShell, PageTopBar, IconLink, IconArrowLeft } from '@/shared/ui';
import { fetchChildren } from '@/entities/child';
import { fetchInviteCodes } from '@/entities/invite-code';
import { InviteCodeListView } from '@/widgets/invite-code-list';

export const metadata: Metadata = { title: '발급 코드' };

export default async function InviteCodesPage() {
  const token = (await cookies()).get('eobom_access')?.value ?? '';
  const [children, codes] = token
    ? await Promise.all([fetchChildren(token), fetchInviteCodes(token)])
    : [[], []];

  return (
    <PageShell>
      <PageTopBar
        title="발급 코드"
        subtitle="아동별 학부모 초대코드"
        back={
          <IconLink label="담당 아동으로" href="/children">
            <IconArrowLeft size={18} />
          </IconLink>
        }
      />
      <InviteCodeListView items={children} codes={codes} />
    </PageShell>
  );
}
