import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { ScheduleDetailResponseDto } from '@eobom/shared';
import { fetchScheduleDetail } from '@/entities/schedule';
import { ScheduleDetailView } from '@/widgets/schedule-detail';
import { TherapistScheduleActions } from '@/features/manage-schedule';

export const metadata: Metadata = { title: '일정 상세' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TherapistScheduleDetailPage({ params }: Props) {
  const { id } = await params;
  const token = (await cookies()).get('eobom_access')?.value ?? '';

  let schedule: ScheduleDetailResponseDto;
  try {
    schedule = await fetchScheduleDetail(token, id);
  } catch {
    notFound();
  }

  return (
    <ScheduleDetailView
      schedule={schedule}
      backHref="/schedules"
      footer={<TherapistScheduleActions scheduleId={schedule.id} status={schedule.status} />}
    />
  );
}
