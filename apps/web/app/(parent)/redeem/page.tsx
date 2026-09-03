import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageShell, PageTopBar, IconLink, IconArrowLeft } from '@/shared/ui';
import { RedeemInviteCodeForm } from '@/features/use-invite-code';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app.parent');
  return { title: t('redeemTitle') };
}

export default async function RedeemPage() {
  const [tApp, tAppCommon] = await Promise.all([
    getTranslations('app.parent'),
    getTranslations('app.common'),
  ]);

  return (
    <PageShell>
      <PageTopBar
        title={tApp('redeemTitle')}
        subtitle={tApp('redeemSubtitle')}
        back={
          <IconLink label={tAppCommon('back.toMe')} href="/me">
            <IconArrowLeft size={18} />
          </IconLink>
        }
      />
      <RedeemInviteCodeForm />
    </PageShell>
  );
}
