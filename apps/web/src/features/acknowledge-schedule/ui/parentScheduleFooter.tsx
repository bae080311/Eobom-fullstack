'use client';

import { useState } from 'react';
import { ConfirmDialog, IconCheck, IconRefresh } from '@/shared/ui';
import { formatDateLabel, formatTime } from '@/shared/lib/date';
import { useAcknowledgeSchedule } from '../model/useAcknowledgeSchedule';

interface Props {
  scheduleId: string;
  initialAcknowledged: boolean;
  initialAcknowledgedAt: string | null;
}

export function ParentScheduleFooter({
  scheduleId,
  initialAcknowledged,
  initialAcknowledgedAt,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { mutate, isPending } = useAcknowledgeSchedule();

  function handleConfirm() {
    mutate(scheduleId, { onSuccess: () => setDialogOpen(false) });
  }

  return (
    <div className="fixed bottom-0 inset-x-0 px-5 py-3 pb-[30px] bg-white/90 backdrop-blur-xl border-t border-gray-200 flex gap-2 z-50">
      <button
        type="button"
        disabled
        className="flex-1 bg-gray-100 text-gray-400 rounded-[10px] py-3 px-4 font-bold text-callout inline-flex items-center justify-center gap-2 border-0 font-sans disabled:opacity-60"
      >
        <IconRefresh size={16} /> 변경 요청
      </button>

      {initialAcknowledged ? (
        <button
          type="button"
          disabled
          className="flex-[2] bg-gray-100 text-gray-500 rounded-[10px] py-3 px-4 font-bold text-callout inline-flex items-center justify-center gap-2 border-0 font-sans"
        >
          <IconCheck size={16} /> 확인 완료
          {initialAcknowledgedAt && (
            <span className="font-medium text-gray-400">
              · {formatDateLabel(initialAcknowledgedAt)} {formatTime(initialAcknowledgedAt)}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex-[2] bg-brand text-white rounded-[10px] py-3 px-4 font-bold text-callout inline-flex items-center justify-center gap-2 border-0 cursor-pointer font-sans"
        >
          <IconCheck size={16} /> 일정 확인
        </button>
      )}

      <ConfirmDialog
        open={dialogOpen}
        title="일정을 확인하시겠어요?"
        description="확인하면 담당 치료사에게 일정을 확인했다는 것이 표시됩니다."
        confirmLabel="확인"
        loading={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}
