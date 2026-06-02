import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ParentTabBar } from '@/widgets/parent-tab-bar';
import { NotificationList, fetchNotifications } from '@/entities/notification';
import { PageShell, PageTopBar, IconLink, IconArrowLeft } from '@/shared/ui';

export const metadata: Metadata = { title: '알림' };

export default async function ParentNotificationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eobom_access')?.value ?? '';

  const notifications = token ? await fetchNotifications(token) : [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <PageShell>
      <PageTopBar
        title="알림"
        subtitle={unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}건` : undefined}
        back={
          <IconLink label="홈으로" href="/home">
            <IconArrowLeft size={18} />
          </IconLink>
        }
      />
      <NotificationList initialData={notifications} />
      <ParentTabBar active="home" />
    </PageShell>
  );
}
