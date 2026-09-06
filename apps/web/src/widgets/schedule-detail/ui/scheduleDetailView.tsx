import type { ReactNode } from 'react';
import Link from 'next/link';
import type { ScheduleDetailResponseDto } from '@eobom/shared';
import { DetailRow, SCHEDULE_STATUS_COLOR } from '@/entities/schedule';
import {
  IconArrowLeft,
  IconButton,
  IconClock,
  IconFileText,
  IconMapPin,
  IconMoreHorizontal,
  IconUser,
} from '@/shared/ui';
import { formatDateLabel, formatTime } from '@/shared/lib/date';
import type { Translate } from '@/shared/lib/i18n';

interface Props {
  schedule: ScheduleDetailResponseDto;
  backHref: string;
  footer: ReactNode;
  // 페이지(Server Component)에서 getTranslations()로 미리 구한 상태 라벨을 prop으로 받는다.
  statusLabel: string;
  // 페이지(Server Component)에서 getTranslations('widgets.scheduleDetail')로 미리 구한 번역기.
  t: Translate;
}

export function ScheduleDetailView({ schedule, backHref, footer, statusLabel, t }: Props) {
  const dateLabel = formatDateLabel(schedule.startAt);
  const timeRange = `${formatTime(schedule.startAt)} ~ ${formatTime(schedule.endAt)}`;

  return (
    <div className="bg-gray-50 min-h-screen font-sans antialiased pb-28">
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-5 py-3 z-10">
        <Link href={backHref} className="inline-flex" aria-label={t('backAria')}>
          <IconButton label={t('backAria')}>
            <IconArrowLeft size={18} />
          </IconButton>
        </Link>
        <span className="text-body font-bold text-gray-900">{t('pageTitle')}</span>
        <IconButton label={t('moreAria')}>
          <IconMoreHorizontal size={18} />
        </IconButton>
      </div>

      <section className="px-5 mt-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <span
            className={`inline-block text-caption2 font-bold px-2 py-0.5 rounded-pill ${SCHEDULE_STATUS_COLOR[schedule.status]}`}
          >
            {statusLabel}
          </span>
          <h1 className="text-title font-bold tracking-tighter text-gray-900 m-0 mt-3">
            {schedule.childName}
          </h1>
          <p className="text-body text-gray-600 mt-1 m-0">{schedule.title}</p>
          <div className="mt-3 flex items-center gap-1.5 text-callout font-semibold text-gray-900">
            <IconClock size={15} /> {dateLabel} · {timeRange}
          </div>
        </div>
      </section>

      <section className="px-5 mt-7">
        <h2 className="text-title3 font-bold tracking-tighter m-0 mb-3">{t('infoSectionTitle')}</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
          {/* 어느 센터의 일정인지 먼저 보여준다 — 레이어 1 §1.4 6단계(기관명·치료사명 함께 표기) */}
          <DetailRow
            icon={<IconMapPin size={16} />}
            label={t('organizationLabel')}
            value={schedule.organizationName}
          />
          <hr className="border-0 border-t border-gray-100 m-0" />
          <DetailRow
            icon={<IconUser size={16} />}
            label={t('primaryTherapistLabel')}
            value={schedule.therapistName}
          />
          <hr className="border-0 border-t border-gray-100 m-0" />
          <DetailRow icon={<IconClock size={16} />} label={t('durationLabel')} value={timeRange} />
          <hr className="border-0 border-t border-gray-100 m-0" />
          <DetailRow
            icon={<IconFileText size={16} />}
            label={t('typeLabel')}
            value={schedule.title}
          />
        </div>
      </section>

      {schedule.notes && (
        <section className="px-5 mt-7">
          <h2 className="text-title3 font-bold tracking-tighter m-0 mb-3">
            {t('memoSectionTitle')}
          </h2>
          <div className="bg-brand-softer border border-brand-soft rounded-lg p-5 text-body leading-relaxed text-gray-700">
            {schedule.notes}
          </div>
        </section>
      )}

      {footer}
    </div>
  );
}
