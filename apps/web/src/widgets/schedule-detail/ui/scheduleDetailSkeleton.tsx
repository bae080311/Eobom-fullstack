import { IconArrowLeft, IconButton, IconMoreHorizontal, Skeleton } from '@/shared/ui';

/** ScheduleDetailView 로딩 중 표시되는 스켈레톤. 치료사·학부모 상세 라우트가 공유한다. */
export function ScheduleDetailSkeleton() {
  return (
    <div className="bg-gray-50 min-h-screen font-sans antialiased pb-28">
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-5 py-3 z-10">
        <IconButton label="뒤로">
          <IconArrowLeft size={18} />
        </IconButton>
        <span className="text-body font-bold text-gray-900">치료 일정 상세</span>
        <IconButton label="더보기">
          <IconMoreHorizontal size={18} />
        </IconButton>
      </div>

      <section className="px-5 mt-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <Skeleton className="h-5 w-12 rounded-pill" />
          <Skeleton className="h-7 w-32 mt-3" />
          <Skeleton className="h-4 w-24 mt-2" />
          <Skeleton className="h-5 w-52 mt-3" />
        </div>
      </section>

      <section className="px-5 mt-7">
        <Skeleton className="h-6 w-20 mb-3" />
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      </section>
    </div>
  );
}
