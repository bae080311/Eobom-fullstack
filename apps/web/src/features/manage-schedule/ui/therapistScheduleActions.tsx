'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ScheduleStatus } from '@eobom/shared';
import { useCancelSchedule, useConfirmSchedule } from '@/entities/schedule';
import { ConfirmDialog, IconCheck, IconRefresh } from '@/shared/ui';
import { EditScheduleForm } from './EditScheduleForm';

interface Props {
  scheduleId: string;
  status: ScheduleStatus;
  title: string;
  startAt: string;
  endAt: string;
  notes: string | null;
}

type DialogKind = 'cancel' | 'complete' | null;

export function TherapistScheduleActions({
  scheduleId,
  status,
  title,
  startAt,
  endAt,
  notes,
}: Props) {
  const t = useTranslations('features.manageSchedule.actions');
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { mutate: cancel, isPending: isCanceling } = useCancelSchedule();
  const { mutate: complete, isPending: isCompleting } = useConfirmSchedule();

  const isTerminal = status === ScheduleStatus.CANCELED || status === ScheduleStatus.COMPLETED;

  function close() {
    setDialog(null);
  }

  function handleCancel() {
    cancel(scheduleId, {
      onSuccess: () => {
        close();
        router.refresh();
      },
    });
  }

  function handleComplete() {
    complete(scheduleId, {
      onSuccess: () => {
        close();
        router.refresh();
      },
    });
  }

  return (
    <div className="fixed bottom-0 inset-x-0 px-5 py-3 pb-[30px] bg-white/90 backdrop-blur-xl border-t border-gray-200 flex gap-2 z-50">
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        disabled={isTerminal}
        className="flex-1 bg-gray-100 text-gray-900 rounded-[10px] py-3 px-4 font-bold text-callout inline-flex items-center justify-center gap-2 border-0 cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
      >
        <IconRefresh size={16} /> {t('edit')}
      </button>

      <button
        type="button"
        onClick={() => setDialog('cancel')}
        disabled={isTerminal}
        className="flex-1 bg-danger-soft text-danger-strong rounded-[10px] py-3 px-4 font-bold text-callout inline-flex items-center justify-center gap-2 border-0 cursor-pointer font-sans disabled:opacity-50"
      >
        {t('cancel')}
      </button>

      <button
        type="button"
        onClick={() => setDialog('complete')}
        disabled={isTerminal}
        className="flex-1 bg-brand text-white rounded-[10px] py-3 px-4 font-bold text-callout inline-flex items-center justify-center gap-2 border-0 cursor-pointer font-sans disabled:opacity-50"
      >
        <IconCheck size={16} /> {t('complete')}
      </button>

      <ConfirmDialog
        open={dialog === 'cancel'}
        title={t('cancelDialogTitle')}
        description={t('cancelDialogDescription')}
        confirmLabel={t('cancelConfirmLabel')}
        destructive
        loading={isCanceling}
        onConfirm={handleCancel}
        onCancel={close}
      />

      <ConfirmDialog
        open={dialog === 'complete'}
        title={t('completeDialogTitle')}
        description={t('completeDialogDescription')}
        confirmLabel={t('completeConfirmLabel')}
        loading={isCompleting}
        onConfirm={handleComplete}
        onCancel={close}
      />

      <EditScheduleForm
        open={editOpen}
        scheduleId={scheduleId}
        title={title}
        startAt={startAt}
        endAt={endAt}
        notes={notes}
        onClose={() => {
          setEditOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
