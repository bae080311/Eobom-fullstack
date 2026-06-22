import { PageShell, PageTopBar, Skeleton } from '@/shared/ui';
import { TherapistTabBar } from '@/widgets/therapist-tab-bar';

export default function ChildrenLoading() {
  return (
    <PageShell>
      <PageTopBar title="담당 아동" subtitle="불러오는 중…" />
      <div className="flex flex-col gap-2 px-5 mt-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <TherapistTabBar active="children" />
    </PageShell>
  );
}
