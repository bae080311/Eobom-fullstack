import type { Metadata } from 'next';
import Link from 'next/link';
import { ParentTabBar } from '@/widgets/parent-tab-bar';
import { NotificationCard, MOCK_NOTIFICATIONS } from '@/entities/notification';
import type { NotificationGroup } from '@/entities/notification';
import { PageShell, PageTopBar, SectionHeader, IconButton, IconArrowLeft } from '@/shared/ui';

export const metadata: Metadata = { title: '알림' };

const GROUPS: NotificationGroup[] = ['오늘', '어제', '이전'];

export default function ParentNotificationsPage() {
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <PageShell>
      <PageTopBar
        title="알림"
        subtitle={unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}건` : undefined}
        action={
          <Link href="/home" aria-label="홈으로" className="inline-flex">
            <IconButton label="홈으로">
              <IconArrowLeft size={18} />
            </IconButton>
          </Link>
        }
      />

      {GROUPS.map((group) => {
        const items = MOCK_NOTIFICATIONS.filter((n) => n.group === group);
        if (items.length === 0) return null;
        return (
          <section key={group} className="px-5 mt-7">
            <SectionHeader title={group} />
            <div className="flex flex-col gap-2">
              {items.map((n) => <NotificationCard key={n.id} notification={n} />)}
            </div>
          </section>
        );
      })}

      <ParentTabBar active="home" />
    </PageShell>
  );
}
