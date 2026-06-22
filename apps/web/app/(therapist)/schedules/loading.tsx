import { PageShell, PageTopBar, Skeleton } from '@/shared/ui';
import { TherapistTabBar } from '@/widgets/therapist-tab-bar';

export default function SchedulesLoading() {
  return (
    <PageShell noPb>
      <PageTopBar title="일정" action={null} />

      <div className="px-5 mt-2">
        <Skeleton className="h-7 w-40" />
        <div className="mt-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      </div>

      <TherapistTabBar active="schedules" />
    </PageShell>
  );
}
