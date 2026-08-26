import { PageShell, PageTopBar, Skeleton, IconLink, IconArrowLeft } from '@/shared/ui';

export default function OrganizationCalendarLoading() {
  return (
    <PageShell noPb>
      <PageTopBar
        title="기관 캘린더"
        back={
          <IconLink label="기관 관리로" href="/organization">
            <IconArrowLeft size={18} />
          </IconLink>
        }
      />

      <div className="px-5 mt-2">
        <Skeleton className="h-7 w-40" />
        <div className="mt-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
