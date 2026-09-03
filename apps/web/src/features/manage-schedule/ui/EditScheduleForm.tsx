'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { toast } from 'sonner';
import type { UpdateScheduleDto } from '@eobom/shared';
import { useUpdateSchedule } from '@/entities/schedule';
import { toKSTDateString, formatTime } from '@/shared/lib/date';
import { ApiError } from '@/lib/api';
import type { Translate } from '@/shared/lib/i18n';

function createFormSchema(t: Translate) {
  return z
    .object({
      title: z.string().min(1, t('titleRequired')),
      date: z.string().min(1, t('dateRequired')),
      startTime: z.string().min(1, t('startTimeRequired')),
      endTime: z.string().min(1, t('endTimeRequired')),
      notes: z.string().optional(),
    })
    .refine((d) => d.startTime < d.endTime, {
      message: t('endTimeAfterStart'),
      path: ['endTime'],
    });
}

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface Props {
  open: boolean;
  scheduleId: string;
  title: string;
  startAt: string;
  endAt: string;
  notes: string | null;
  onClose: () => void;
}

const inputCls =
  'rounded-[10px] border border-gray-200 px-4 py-3 text-body text-gray-900 outline-none focus:border-brand';
const errorCls = 'mt-1 text-xs text-danger-strong';

export function EditScheduleForm({
  open,
  scheduleId,
  title,
  startAt,
  endAt,
  notes,
  onClose,
}: Props) {
  const t = useTranslations('features.manageSchedule.editForm');
  const formSchema = useMemo(() => createFormSchema(t), [t]);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title,
      date: toKSTDateString(startAt),
      startTime: formatTime(startAt),
      endTime: formatTime(endAt),
      notes: notes ?? '',
    },
  });
  const { mutate, isPending } = useUpdateSchedule();

  useEffect(() => {
    if (open) {
      form.reset({
        title,
        date: toKSTDateString(startAt),
        startTime: formatTime(startAt),
        endTime: formatTime(endAt),
        notes: notes ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, title, startAt, endAt, notes]);

  if (!open) return null;

  const { errors } = form.formState;

  const handleClose = () => {
    onClose();
  };

  const onSubmit = (data: FormData) => {
    const newStartAt = new Date(`${data.date}T${data.startTime}:00+09:00`).toISOString();
    const newEndAt = new Date(`${data.date}T${data.endTime}:00+09:00`).toISOString();
    const dto: UpdateScheduleDto = {
      title: data.title.trim(),
      notes: data.notes?.trim() ?? '',
    };
    if (newStartAt !== startAt) dto.startAt = newStartAt;
    if (newEndAt !== endAt) dto.endAt = newEndAt;

    mutate(
      { id: scheduleId, dto },
      {
        onSuccess: () => {
          toast.success(t('updateSuccess'));
          onClose();
        },
        onError: (err) => {
          console.error(err);
          toast.error(err instanceof ApiError ? err.message : t('updateError'));
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-5 pb-8"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 flex flex-col gap-4"
      >
        <h2 className="text-title3 font-bold tracking-tighter text-gray-900 m-0">{t('title')}</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-600 font-semibold">{t('titleLabel')}</span>
          <input
            {...form.register('title')}
            placeholder={t('titlePlaceholder')}
            className={inputCls}
          />
          {errors.title && <span className={errorCls}>{errors.title.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-600 font-semibold">{t('dateLabel')}</span>
          <input type="date" {...form.register('date')} className={inputCls} />
          {errors.date && <span className={errorCls}>{errors.date.message}</span>}
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-label text-gray-600 font-semibold">{t('startTimeLabel')}</span>
            <input type="time" {...form.register('startTime')} className={inputCls} />
            {errors.startTime && <span className={errorCls}>{errors.startTime.message}</span>}
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-label text-gray-600 font-semibold">{t('endTimeLabel')}</span>
            <input type="time" {...form.register('endTime')} className={inputCls} />
            {errors.endTime && <span className={errorCls}>{errors.endTime.message}</span>}
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-600 font-semibold">{t('memoLabel')}</span>
          <textarea {...form.register('notes')} rows={2} className={`${inputCls} resize-none`} />
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
            className="flex-1 bg-brand text-white rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans disabled:opacity-50"
          >
            {isPending ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
