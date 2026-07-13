'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { UpdateScheduleDto } from '@eobom/shared';
import { useUpdateSchedule } from '@/entities/schedule';
import { toKSTDateString, formatTime } from '@/shared/lib/date';
import { ApiError } from '@/lib/api';

const formSchema = z
  .object({
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

type FormData = z.infer<typeof formSchema>;

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
const errorCls = 'mt-1 text-xs text-danger';

export function EditScheduleForm({
  open,
  scheduleId,
  title,
  startAt,
  endAt,
  notes,
  onClose,
}: Props) {
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
          toast.success('일정이 수정되었습니다');
          onClose();
        },
        onError: (err) => {
          console.error(err);
          toast.error(err instanceof ApiError ? err.message : '일정 수정에 실패했습니다');
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
        <h2 className="text-title3 font-bold tracking-tighter text-gray-900 m-0">일정 수정</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-500 font-semibold">치료 유형</span>
          <input {...form.register('title')} placeholder="예: 언어치료" className={inputCls} />
          {errors.title && <span className={errorCls}>{errors.title.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-500 font-semibold">날짜</span>
          <input type="date" {...form.register('date')} className={inputCls} />
          {errors.date && <span className={errorCls}>{errors.date.message}</span>}
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-label text-gray-500 font-semibold">시작 시간</span>
            <input type="time" {...form.register('startTime')} className={inputCls} />
            {errors.startTime && <span className={errorCls}>{errors.startTime.message}</span>}
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-label text-gray-500 font-semibold">종료 시간</span>
            <input type="time" {...form.register('endTime')} className={inputCls} />
            {errors.endTime && <span className={errorCls}>{errors.endTime.message}</span>}
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-500 font-semibold">메모 (선택)</span>
          <textarea {...form.register('notes')} rows={2} className={`${inputCls} resize-none`} />
        </label>

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
            {isPending ? '수정 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
