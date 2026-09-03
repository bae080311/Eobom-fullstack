import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { PageShell, PageTopBar, IconLink, IconArrowLeft } from '@/shared/ui';
import { fetchChildren } from '@/entities/child';
import { fetchInviteCodes } from '@/entities/invite-code';
import { InviteCodeListView } from '@/widgets/invite-code-list';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app.therapist');
  return { title: t('inviteCodesTitle') };
}

export default async function InviteCodesPage() {
  const token = (await cookies()).get('eobom_access')?.value ?? '';
  const [[children, codes], tApp, tAppCommon, t, tWidget] = await Promise.all([
    token
      ? Promise.all([fetchChildren(token), fetchInviteCodes(token)])
      : Promise.resolve([[], []]),
    getTranslations('app.therapist'),
    getTranslations('app.common'),
    getTranslations('entities.inviteCode'),
    getTranslations('widgets.inviteCodeList'),
  ]);

  return (
    <PageShell>
      <PageTopBar
        title={tApp('inviteCodesTitle')}
        subtitle={tApp('inviteCodesSubtitle')}
        back={
          <IconLink label={tAppCommon('back.toChildren')} href="/children">
            <IconArrowLeft size={18} />
          </IconLink>
        }
      />
      <InviteCodeListView items={children} codes={codes} t={t} tWidget={tWidget} />
    </PageShell>
  );
}
