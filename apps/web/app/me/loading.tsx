import { PageShell, Skeleton } from '@/shared/ui';

export default function MyInfoLoading() {
  return (
    <PageShell>
      <section className="px-5 mt-4 flex flex-col items-center">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-6 w-28 mt-4" />
        <Skeleton className="h-4 w-40 mt-2" />
      </section>
      <section className="px-5 mt-8 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </section>
    </PageShell>
  );
}
