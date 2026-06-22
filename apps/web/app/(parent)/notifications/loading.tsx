import { PageShell, PageTopBar, Skeleton, IconLink, IconArrowLeft } from '@/shared/ui';
import { ParentTabBar } from '@/widgets/parent-tab-bar';

export default function NotificationsLoading() {
  return (
    <PageShell>
      <PageTopBar
        title="알림"
        back={
          <IconLink label="홈으로" href="/home">
            <IconArrowLeft size={18} />
          </IconLink>
        }
      />
      <section className="px-5 mt-7">
        <Skeleton className="h-5 w-16 mb-3" />
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </section>
      <ParentTabBar active="home" />
    </PageShell>
  );
}
