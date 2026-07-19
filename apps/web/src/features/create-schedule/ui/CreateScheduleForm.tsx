'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { ChildResponseDto } from '@eobom/shared';
import { useCreateSchedule, useCreateRecurringSchedule } from '@/entities/schedule';

const singleFormSchema = z
  .object({
    childId: z.string().min(1, '아동을 선택해주세요'),
    title: z.string().min(1, '치료 유형을 입력해주세요'),
    date: z.string().min(1, '날짜를 선택해주세요'),
    startTime: z.string().min(1, '시작 시간을 선택해주세요'),
    endTime: z.string().min(1, '종료 시간을 선택해주세요'),
    notes: z.string().optional(),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: '종료 시간은 시작 시간보다 늦어야 합니다',
    path: ['endTime'],
  });

type SingleFormData = z.infer<typeof singleFormSchema>;

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const recurringFormSchema = z
  .object({
    childId: z.string().min(1, '아동을 선택해주세요'),
    title: z.string().min(1, '치료 유형을 입력해주세요'),
    daysOfWeek: z.array(z.string()).min(1, '반복할 요일을 선택해주세요'),
    startTime: z.string().min(1, '시작 시간을 선택해주세요'),
    endTime: z.string().min(1, '종료 시간을 선택해주세요'),
    startDate: z.string().min(1, '시작일을 선택해주세요'),
    endDate: z.string().optional(),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: '종료 시간은 시작 시간보다 늦어야 합니다',
    path: ['endTime'],
  })
  .refine((d) => !d.endDate || d.startDate <= d.endDate, {
    message: '종료일은 시작일보다 늦어야 합니다',
    path: ['endDate'],
  });

type RecurringFormData = z.infer<typeof recurringFormSchema>;

interface Props {
  open: boolean;
  childList: ChildResponseDto[];
  childrenLoading: boolean;
  onClose: () => void;
}

const inputCls =
  'rounded-[10px] border border-gray-200 px-4 py-3 text-body text-gray-900 outline-none focus:border-brand';
const errorCls = 'mt-1 text-xs text-danger';

export function CreateScheduleForm({ open, childList, childrenLoading, onClose }: Props) {
  const [mode, setMode] = useState<'single' | 'recurring'>('single');

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
          toast.success('일정이 추가되었습니다');
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
          toast.success(`반복 일정 ${result.schedules.length}건이 추가되었습니다`);
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
        <h2 className="text-title3 font-bold tracking-tighter text-gray-900 m-0">일정 추가</h2>

        <div className="flex rounded-[10px] bg-gray-100 p-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'single'}
            onClick={() => setMode('single')}
            className={`flex-1 rounded-lg py-2 text-callout font-bold border-0 cursor-pointer font-sans ${
              mode === 'single' ? 'bg-white text-gray-900' : 'bg-transparent text-gray-500'
            }`}
          >
            단일 일정
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'recurring'}
            onClick={() => setMode('recurring')}
            className={`flex-1 rounded-lg py-2 text-callout font-bold border-0 cursor-pointer font-sans ${
              mode === 'recurring' ? 'bg-white text-gray-900' : 'bg-transparent text-gray-500'
            }`}
          >
            반복 일정
          </button>
        </div>

        {mode === 'single' ? (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-label text-gray-500 font-semibold">아동</span>
              <select
                {...singleForm.register('childId')}
                className={inputCls}
                defaultValue=""
                disabled={childrenLoading}
              >
                <option value="" disabled>
                  {childrenLoading ? '불러오는 중...' : '아동을 선택하세요'}
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
              <span className="text-label text-gray-500 font-semibold">치료 유형</span>
              <input
                {...singleForm.register('title')}
                placeholder="예: 언어치료"
                className={inputCls}
              />
              {singleErrors.title && <span className={errorCls}>{singleErrors.title.message}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-label text-gray-500 font-semibold">날짜</span>
              <input type="date" {...singleForm.register('date')} className={inputCls} />
              {singleErrors.date && <span className={errorCls}>{singleErrors.date.message}</span>}
            </label>

            <div className="flex gap-3">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-label text-gray-500 font-semibold">시작 시간</span>
                <input type="time" {...singleForm.register('startTime')} className={inputCls} />
                {singleErrors.startTime && (
                  <span className={errorCls}>{singleErrors.startTime.message}</span>
                )}
              </label>
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-label text-gray-500 font-semibold">종료 시간</span>
                <input type="time" {...singleForm.register('endTime')} className={inputCls} />
                {singleErrors.endTime && (
                  <span className={errorCls}>{singleErrors.endTime.message}</span>
                )}
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-label text-gray-500 font-semibold">메모 (선택)</span>
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
              <span className="text-label text-gray-500 font-semibold">아동</span>
              <select
                {...recurringForm.register('childId')}
                className={inputCls}
                defaultValue=""
                disabled={childrenLoading}
              >
                <option value="" disabled>
                  {childrenLoading ? '불러오는 중...' : '아동을 선택하세요'}
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
              <span className="text-label text-gray-500 font-semibold">치료 유형</span>
              <input
                {...recurringForm.register('title')}
                placeholder="예: 언어치료"
                className={inputCls}
              />
              {recurringErrors.title && (
                <span className={errorCls}>{recurringErrors.title.message}</span>
              )}
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-label text-gray-500 font-semibold">반복 요일</span>
              <div className="flex gap-1.5">
                {DAY_LABELS.map((label, day) => (
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
                <span className="text-label text-gray-500 font-semibold">시작 시간</span>
                <input type="time" {...recurringForm.register('startTime')} className={inputCls} />
                {recurringErrors.startTime && (
                  <span className={errorCls}>{recurringErrors.startTime.message}</span>
                )}
              </label>
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-label text-gray-500 font-semibold">종료 시간</span>
                <input type="time" {...recurringForm.register('endTime')} className={inputCls} />
                {recurringErrors.endTime && (
                  <span className={errorCls}>{recurringErrors.endTime.message}</span>
                )}
              </label>
            </div>

            <div className="flex gap-3">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-label text-gray-500 font-semibold">시작일</span>
                <input type="date" {...recurringForm.register('startDate')} className={inputCls} />
                {recurringErrors.startDate && (
                  <span className={errorCls}>{recurringErrors.startDate.message}</span>
                )}
              </label>
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-label text-gray-500 font-semibold">종료일 (선택)</span>
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
            취소
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-brand text-white rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans disabled:opacity-50"
          >
            {isPending ? '추가 중...' : '추가'}
          </button>
        </div>
      </form>
    </div>
  );
}
