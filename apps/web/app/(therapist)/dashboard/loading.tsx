import { PageShell, PageTopBar, Skeleton } from '@/shared/ui';
import { TherapistTabBar } from '@/widgets/therapist-tab-bar';

export default function DashboardLoading() {
  return (
    <PageShell>
      <PageTopBar action={<Skeleton className="h-8 w-8 rounded-full" />} />

      <section className="px-5 mt-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-7 w-48 mt-2.5" />
        <Skeleton className="h-4 w-20 mt-2" />
      </section>

      <section className="px-5 mt-6">
        <Skeleton className="h-5 w-32" />
        <div className="flex flex-col gap-3 mt-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </section>

      <section className="px-5 mt-8">
        <Skeleton className="h-5 w-28" />
        <div className="mt-3 flex justify-between">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-2 w-2 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <TherapistTabBar active="home" />
    </PageShell>
  );
}
