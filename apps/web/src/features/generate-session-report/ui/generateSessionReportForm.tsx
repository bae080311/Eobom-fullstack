'use client';

import type { MouseEvent } from 'react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { toast } from 'sonner';
import { REPORT_MEMO_MAX_LENGTH, REPORT_MEMO_MIN_LENGTH } from '@eobom/shared';
import { ApiError } from '@/lib/api';
import type { Translate } from '@/shared/lib/i18n';
import { useGenerateSessionReport } from '../model/useGenerateSessionReport';

// 길이 제약은 API의 generateReportSchema와 같은 상수를 쓴다 — 메시지만 i18n으로 갈아끼운다.
function createFormSchema(t: Translate) {
  return z.object({
    memo: z
      .string()
      .min(REPORT_MEMO_MIN_LENGTH, t('memoTooShort', { min: REPORT_MEMO_MIN_LENGTH }))
      .max(REPORT_MEMO_MAX_LENGTH, t('memoTooLong', { max: REPORT_MEMO_MAX_LENGTH })),
  });
}

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface Props {
  open: boolean;
  scheduleId: string;
  // 재생성일 때 기존 원본 메모를 채워 넣어 처음부터 다시 쓰지 않게 한다.
  initialMemo: string;
  onClose: () => void;
}

const inputCls =
  'rounded-[10px] border border-gray-200 px-4 py-3 text-body text-gray-900 outline-none focus:border-brand';
const errorCls = 'mt-1 text-xs text-danger-strong';

export function GenerateSessionReportForm({ open, scheduleId, initialMemo, onClose }: Props) {
  const t = useTranslations('features.generateSessionReport');
  const schema = useMemo(() => createFormSchema(t), [t]);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: { memo: initialMemo },
  });
  const { mutate, isPending } = useGenerateSessionReport(scheduleId);

  if (!open) return null;

  const { errors } = form.formState;

  function handleClose() {
    if (isPending) return; // 생성 중에는 닫지 않는다 — 요청은 계속 진행되므로 결과를 놓치게 된다.
    onClose();
  }

  function handlePanelClick(event: MouseEvent) {
    event.stopPropagation();
  }

  function onSubmit(data: FormData) {
    mutate(data.memo.trim(), {
      onSuccess: () => {
        toast.success(t('generateSuccess'));
        onClose();
      },
      onError: (err) => {
        // Ollama 미기동·타임아웃은 503으로 온다 — 재시도하면 되는 상황이라 따로 안내한다.
        if (err instanceof ApiError) {
          toast.error(err.status === 503 ? t('unavailableError') : err.message);
          return;
        }
        toast.error(t('generateError'));
      },
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-5 pb-8"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onClick={handlePanelClick}
        className="w-full max-w-md rounded-2xl bg-white p-6 flex flex-col gap-4"
      >
        <div>
          <h2 className="text-title3 font-bold tracking-tighter text-gray-900 m-0">{t('title')}</h2>
          <p className="text-body2 text-gray-600 mt-1 m-0 leading-relaxed">{t('description')}</p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-600 font-semibold">{t('memoLabel')}</span>
          <textarea
            {...form.register('memo')}
            rows={6}
            placeholder={t('memoPlaceholder')}
            className={`${inputCls} resize-none`}
          />
          {errors.memo && <span className={errorCls}>{errors.memo.message}</span>}
        </label>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="flex-1 bg-gray-100 text-gray-900 rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-[2] bg-brand text-white rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans disabled:opacity-50"
          >
            {isPending ? t('submitting') : t('submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
