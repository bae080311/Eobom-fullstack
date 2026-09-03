'use client';

import { useTranslations } from 'next-intl';
import { PageShell, PageTopBar, Skeleton } from '@/shared/ui';
import { TherapistTabBar } from '@/widgets/therapist-tab-bar';

export default function ChildrenLoading() {
  const t = useTranslations('app.therapist');

  return (
    <PageShell>
      <PageTopBar title={t('childrenTitle')} subtitle={t('loadingLabel')} />
      <div className="flex flex-col gap-2 px-5 mt-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <TherapistTabBar active="children" />
    </PageShell>
  );
}
