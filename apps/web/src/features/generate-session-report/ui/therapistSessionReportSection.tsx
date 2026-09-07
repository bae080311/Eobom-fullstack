'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { SessionReportResponseDto } from '@eobom/shared';
import {
  SessionReportCard,
  SessionReportSection,
  useSessionReport,
} from '@/entities/session-report';
import { ConfirmDialog } from '@/shared/ui';
import { GenerateSessionReportForm } from './generateSessionReportForm';

interface Props {
  scheduleId: string;
  // 페이지(Server Component)가 조회한 결과. 리포트가 아직 없으면 null.
  initialReport: SessionReportResponseDto | null;
}

export function TherapistSessionReportSection({ scheduleId, initialReport }: Props) {
  const t = useTranslations('features.generateSessionReport');
  const tReport = useTranslations('entities.sessionReport');
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: report } = useSessionReport(scheduleId, initialReport);

  function handleCreate() {
    setFormOpen(true);
  }

  // 재생성은 upsert라 기존 리포트를 덮어쓴다 — 확인 없이 실행하지 않는다.
  function handleRegenerateRequest() {
    setConfirmOpen(true);
  }

  function handleRegenerateConfirm() {
    setConfirmOpen(false);
    setFormOpen(true);
  }

  function handleConfirmCancel() {
    setConfirmOpen(false);
  }

  function handleFormClose() {
    setFormOpen(false);
  }

  return (
    <SessionReportSection
      title={tReport('sectionTitle')}
      action={
        <button
          type="button"
          onClick={report ? handleRegenerateRequest : handleCreate}
          className="bg-gray-100 text-gray-900 rounded-[10px] py-2 px-3 font-bold text-label border-0 cursor-pointer font-sans focus-visible:outline-none focus-visible:shadow-focus"
        >
          {report ? t('regenerateButton') : t('createButton')}
        </button>
      }
    >
      {report ? (
        <SessionReportCard report={report} t={tReport} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-5 text-center">
          <p className="text-body text-gray-600 m-0">{t('empty')}</p>
          <p className="text-body2 text-gray-500 mt-1 m-0 leading-relaxed">{t('emptyHint')}</p>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={t('regenerateConfirmTitle')}
        description={t('regenerateConfirmDescription')}
        confirmLabel={t('regenerateConfirmLabel')}
        onConfirm={handleRegenerateConfirm}
        onCancel={handleConfirmCancel}
      />

      <GenerateSessionReportForm
        open={formOpen}
        scheduleId={scheduleId}
        initialMemo={report?.rawMemo ?? ''}
        onClose={handleFormClose}
      />
    </SessionReportSection>
  );
}
