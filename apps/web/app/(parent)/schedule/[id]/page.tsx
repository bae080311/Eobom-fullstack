import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { ScheduleDetailResponseDto } from '@eobom/shared';
import { fetchScheduleDetail } from '@/entities/schedule';
import { ScheduleDetailView } from '@/widgets/schedule-detail';
import { ParentScheduleFooter } from '@/features/acknowledge-schedule';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app.parent');
  return { title: t('scheduleDetailTitle') };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ParentScheduleDetailPage({ params }: Props) {
  const { id } = await params;
  const token = (await cookies()).get('eobom_access')?.value ?? '';

  const tStatusPromise = getTranslations('entities.schedule.status');
  const tWidgetPromise = getTranslations('widgets.scheduleDetail');
  let schedule: ScheduleDetailResponseDto;
  try {
    schedule = await fetchScheduleDetail(token, id);
  } catch {
    notFound();
  }
  const [tStatus, tWidget] = await Promise.all([tStatusPromise, tWidgetPromise]);

  return (
    <ScheduleDetailView
      schedule={schedule}
      backHref="/schedule"
      statusLabel={tStatus(schedule.status)}
      t={tWidget}
      footer={
        <ParentScheduleFooter
          scheduleId={schedule.id}
          initialAcknowledged={schedule.acknowledged}
          initialAcknowledgedAt={schedule.acknowledgedAt}
        />
      }
    />
  );
}
