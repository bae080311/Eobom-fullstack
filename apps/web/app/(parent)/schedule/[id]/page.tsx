import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { ScheduleDetailResponseDto } from '@eobom/shared';
import { fetchScheduleDetail } from '@/entities/schedule';
import {
  fetchSessionReport,
  SessionReportCard,
  SessionReportSection,
} from '@/entities/session-report';
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
  const tReportPromise = getTranslations('entities.sessionReport');
  let schedule: ScheduleDetailResponseDto;
  try {
    schedule = await fetchScheduleDetail(token, id);
  } catch {
    notFound();
  }
  const [tStatus, tWidget, tReport, report] = await Promise.all([
    tStatusPromise,
    tWidgetPromise,
    tReportPromise,
    fetchSessionReport(token, id),
  ]);

  return (
    <ScheduleDetailView
      schedule={schedule}
      backHref="/schedule"
      statusLabel={tStatus(schedule.status)}
      t={tWidget}
      // 학부모는 열람만 한다. 아직 리포트가 없는 일정(예정된 세션 등)에는 섹션 자체를 띄우지 않는다.
      extra={
        report ? (
          <SessionReportSection title={tReport('sectionTitle')}>
            <SessionReportCard report={report} t={tReport} />
          </SessionReportSection>
        ) : null
      }
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
