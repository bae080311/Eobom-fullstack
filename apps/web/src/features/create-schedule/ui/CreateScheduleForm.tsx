'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { toast } from 'sonner';
import type { ChildResponseDto } from '@eobom/shared';
import { useCreateSchedule, useCreateRecurringSchedule } from '@/entities/schedule';
import type { Translate } from '@/shared/lib/i18n';

function createSingleFormSchema(t: Translate) {
  return z
    .object({
      childId: z.string().min(1, t('childRequired')),
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

type SingleFormData = z.infer<ReturnType<typeof createSingleFormSchema>>;

function createRecurringFormSchema(t: Translate) {
  return z
    .object({
      childId: z.string().min(1, t('childRequired')),
      title: z.string().min(1, t('titleRequired')),
      daysOfWeek: z.array(z.string()).min(1, t('daysOfWeekRequired')),
      startTime: z.string().min(1, t('startTimeRequired')),
      endTime: z.string().min(1, t('endTimeRequired')),
      startDate: z.string().min(1, t('startDateRequired')),
      endDate: z.string().optional(),
    })
    .refine((d) => d.startTime < d.endTime, {
      message: t('endTimeAfterStart'),
      path: ['endTime'],
    })
    .refine((d) => !d.endDate || d.startDate <= d.endDate, {
      message: t('endDateAfterStart'),
      path: ['endDate'],
    });
}

type RecurringFormData = z.infer<ReturnType<typeof createRecurringFormSchema>>;

interface Props {
  open: boolean;
  childList: ChildResponseDto[];
  childrenLoading: boolean;
  onClose: () => void;
}

const inputCls =
  'rounded-[10px] border border-gray-200 px-4 py-3 text-body text-gray-900 outline-none focus:border-brand';
const errorCls = 'mt-1 text-xs text-danger-strong';

export function CreateScheduleForm({ open, childList, childrenLoading, onClose }: Props) {
  const t = useTranslations('features.createSchedule');
  const dayLabels = useMemo(() => t.raw('dayLabels') as string[], [t]);
  const [mode, setMode] = useState<'single' | 'recurring'>('single');

  const singleFormSchema = useMemo(() => createSingleFormSchema(t), [t]);
  const recurringFormSchema = useMemo(() => createRecurringFormSchema(t), [t]);

  const singleForm = useForm<SingleFormData>({
    resolver: zodResolver(singleFormSchema),
    defaultValues: { childId: '', title: '', date: '', startTime: '', endTime: '', notes: '' },
  });
  const recurringForm = useForm<RecurringFormData>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: {
      childId: '',
      title: '',
      daysOfWeek: [],
      startTime: '',
      endTime: '',
      startDate: '',
      endDate: '',
    },
  });

  const { mutate: createSingle, isPending: isSinglePending } = useCreateSchedule();
  const { mutate: createRecurring, isPending: isRecurringPending } = useCreateRecurringSchedule();
  const isPending = mode === 'single' ? isSinglePending : isRecurringPending;

  if (!open) return null;

  const handleClose = () => {
    singleForm.reset();
    recurringForm.reset();
    setMode('single');
    onClose();
  };

  const onSubmitSingle = (data: SingleFormData) => {
    const startAt = new Date(`${data.date}T${data.startTime}:00+09:00`).toISOString();
    const endAt = new Date(`${data.date}T${data.endTime}:00+09:00`).toISOString();
    createSingle(
      {
        childId: data.childId,
        title: data.title.trim(),
        startAt,
        endAt,
        notes: data.notes?.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t('createSuccess'));
          handleClose();
        },
      },
    );
  };

  const onSubmitRecurring = (data: RecurringFormData) => {
    createRecurring(
      {
        childId: data.childId,
        title: data.title.trim(),
        daysOfWeek: data.daysOfWeek.map(Number),
        startTime: data.startTime,
        endTime: data.endTime,
        timezone: 'Asia/Seoul',
        startDate: data.startDate,
        endDate: data.endDate || undefined,
      },
      {
        onSuccess: (result) => {
          toast.success(t('recurringCreateSuccess', { count: result.schedules.length }));
          handleClose();
        },
      },
    );
  };

  const singleErrors = singleForm.formState.errors;
  const recurringErrors = recurringForm.formState.errors;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-5 pb-8"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <form
        onSubmit={
          mode === 'single'
            ? singleForm.handleSubmit(onSubmitSingle)
            : recurringForm.handleSubmit(onSubmitRecurring)
        }
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 flex flex-col gap-4"
      >
        <h2 className="text-title3 font-bold tracking-tighter text-gray-900 m-0">{t('title')}</h2>

        <div className="flex rounded-[10px] bg-gray-100 p-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'single'}
            onClick={() => setMode('single')}
            className={`flex-1 rounded-lg py-2 text-callout font-bold border-0 cursor-pointer font-sans ${
              mode === 'single' ? 'bg-white text-gray-900' : 'bg-transparent text-gray-700'
            }`}
          >
            {t('singleTab')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'recurring'}
            onClick={() => setMode('recurring')}
            className={`flex-1 rounded-lg py-2 text-callout font-bold border-0 cursor-pointer font-sans ${
              mode === 'recurring' ? 'bg-white text-gray-900' : 'bg-transparent text-gray-700'
            }`}
          >
            {t('recurringTab')}
          </button>
        </div>

        {mode === 'single' ? (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-label text-gray-600 font-semibold">{t('childLabel')}</span>
              <select
                {...singleForm.register('childId')}
                className={inputCls}
                defaultValue=""
                disabled={childrenLoading}
              >
                <option value="" disabled>
                  {childrenLoading ? t('loadingChildren') : t('selectChildPlaceholder')}
                </option>
                {childList.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
              {singleErrors.childId && (
                <span className={errorCls}>{singleErrors.childId.message}</span>
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-label text-gray-600 font-semibold">{t('titleLabel')}</span>
              <input
                {...singleForm.register('title')}
                placeholder={t('titlePlaceholder')}
                className={inputCls}
              />
              {singleErrors.title && <span className={errorCls}>{singleErrors.title.message}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-label text-gray-600 font-semibold">{t('dateLabel')}</span>
              <input type="date" {...singleForm.register('date')} className={inputCls} />
              {singleErrors.date && <span className={errorCls}>{singleErrors.date.message}</span>}
            </label>

            <div className="flex gap-3">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-label text-gray-600 font-semibold">
                  {t('startTimeLabel')}
                </span>
                <input type="time" {...singleForm.register('startTime')} className={inputCls} />
                {singleErrors.startTime && (
                  <span className={errorCls}>{singleErrors.startTime.message}</span>
                )}
              </label>
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-label text-gray-600 font-semibold">{t('endTimeLabel')}</span>
                <input type="time" {...singleForm.register('endTime')} className={inputCls} />
                {singleErrors.endTime && (
                  <span className={errorCls}>{singleErrors.endTime.message}</span>
                )}
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-label text-gray-600 font-semibold">{t('memoLabel')}</span>
              <textarea
                {...singleForm.register('notes')}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </label>
          </>
        ) : (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-label text-gray-600 font-semibold">{t('childLabel')}</span>
              <select
                {...recurringForm.register('childId')}
                className={inputCls}
                defaultValue=""
                disabled={childrenLoading}
              >
                <option value="" disabled>
                  {childrenLoading ? t('loadingChildren') : t('selectChildPlaceholder')}
                </option>
                {childList.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
              {recurringErrors.childId && (
                <span className={errorCls}>{recurringErrors.childId.message}</span>
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-label text-gray-600 font-semibold">{t('titleLabel')}</span>
              <input
                {...recurringForm.register('title')}
                placeholder={t('titlePlaceholder')}
                className={inputCls}
              />
              {recurringErrors.title && (
                <span className={errorCls}>{recurringErrors.title.message}</span>
              )}
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-label text-gray-600 font-semibold">{t('daysOfWeekLabel')}</span>
              <div className="flex gap-1.5">
                {dayLabels.map((label, day) => (
                  <label
                    key={day}
                    className="flex h-9 flex-1 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-callout font-semibold text-gray-700 has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white"
                  >
                    <input
                      type="checkbox"
                      value={day}
                      className="sr-only"
                      {...recurringForm.register('daysOfWeek')}
                    />
                    {label}
                  </label>
                ))}
              </div>
              {recurringErrors.daysOfWeek && (
                <span className={errorCls}>{recurringErrors.daysOfWeek.message}</span>
              )}
            </div>

            <div className="flex gap-3">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-label text-gray-600 font-semibold">
                  {t('startTimeLabel')}
                </span>
                <input type="time" {...recurringForm.register('startTime')} className={inputCls} />
                {recurringErrors.startTime && (
                  <span className={errorCls}>{recurringErrors.startTime.message}</span>
                )}
              </label>
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-label text-gray-600 font-semibold">{t('endTimeLabel')}</span>
                <input type="time" {...recurringForm.register('endTime')} className={inputCls} />
                {recurringErrors.endTime && (
                  <span className={errorCls}>{recurringErrors.endTime.message}</span>
                )}
              </label>
            </div>

            <div className="flex gap-3">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-label text-gray-600 font-semibold">
                  {t('startDateLabel')}
                </span>
                <input type="date" {...recurringForm.register('startDate')} className={inputCls} />
                {recurringErrors.startDate && (
                  <span className={errorCls}>{recurringErrors.startDate.message}</span>
                )}
              </label>
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-label text-gray-600 font-semibold">{t('endDateLabel')}</span>
                <input type="date" {...recurringForm.register('endDate')} className={inputCls} />
                {recurringErrors.endDate && (
                  <span className={errorCls}>{recurringErrors.endDate.message}</span>
                )}
              </label>
            </div>
          </>
        )}

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
            {isPending ? t('submitting') : t('submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
