import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { ScheduleDetailResponseDto } from '@eobom/shared';
import { fetchScheduleDetail } from '@/entities/schedule';
import { ScheduleDetailView } from '@/widgets/schedule-detail';
import { ParentScheduleFooter } from '@/features/acknowledge-schedule';

export const metadata: Metadata = { title: '일정 상세' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ParentScheduleDetailPage({ params }: Props) {
  const { id } = await params;
  const token = (await cookies()).get('eobom_access')?.value ?? '';

  const tPromise = getTranslations('entities.schedule.status');
  let schedule: ScheduleDetailResponseDto;
  try {
    schedule = await fetchScheduleDetail(token, id);
  } catch {
    notFound();
  }
  const t = await tPromise;

  return (
    <ScheduleDetailView
      schedule={schedule}
      backHref="/schedule"
      statusLabel={t(schedule.status)}
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
