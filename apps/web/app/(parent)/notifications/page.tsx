import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { ParentTabBar } from '@/widgets/parent-tab-bar';
import { NotificationList, fetchNotifications } from '@/entities/notification';
import { PageShell, PageTopBar, IconLink, IconArrowLeft } from '@/shared/ui';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app.parent');
  return { title: t('notificationsTitle') };
}

export default async function ParentNotificationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  const [tApp, tAppCommon] = await Promise.all([
    getTranslations('app.parent'),
    getTranslations('app.common'),
  ]);

  const notifications = token ? await fetchNotifications(token) : [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <PageShell>
      <PageTopBar
        title={tApp('notificationsTitle')}
        subtitle={unreadCount > 0 ? tApp('unreadCount', { count: unreadCount }) : undefined}
        back={
          <IconLink label={tAppCommon('back.toHome')} href="/home">
            <IconArrowLeft size={18} />
          </IconLink>
        }
      />
      <NotificationList initialData={notifications} />
      <ParentTabBar active="home" />
    </PageShell>
  );
}
