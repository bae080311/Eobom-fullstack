'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useUpdateChild } from '@/entities/child';
import { ApiError } from '@/lib/api';

const formSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  birthDate: z.string().optional(),
  memo: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  childId: string;
  name: string;
  birthDate: string | null;
  memo: string | null;
  onClose: () => void;
}

const inputCls =
  'rounded-[10px] border border-gray-200 px-4 py-3 text-body text-gray-900 outline-none focus:border-brand';
const errorCls = 'mt-1 text-xs text-danger';

function defaultsFrom(name: string, birthDate: string | null, memo: string | null): FormData {
  return { name, birthDate: birthDate ? birthDate.slice(0, 10) : '', memo: memo ?? '' };
}

export function EditChildForm({ open, childId, name, birthDate, memo, onClose }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultsFrom(name, birthDate, memo),
  });
  const { mutate, isPending } = useUpdateChild();

  useEffect(() => {
    if (open) {
      form.reset(defaultsFrom(name, birthDate, memo));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, name, birthDate, memo]);

  if (!open) return null;

  const { errors } = form.formState;

  const onSubmit = (data: FormData) => {
    mutate(
      {
        id: childId,
        dto: {
          name: data.name.trim(),
          birthDate: data.birthDate || null,
          memo: data.memo?.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success('아동 정보가 수정되었습니다');
          onClose();
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : '아동 정보 수정에 실패했습니다');
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-5 pb-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 flex flex-col gap-4"
      >
        <h2 className="text-title3 font-bold tracking-tighter text-gray-900 m-0">아동 정보 수정</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-500 font-semibold">이름</span>
          <input {...form.register('name')} className={inputCls} />
          {errors.name && <span className={errorCls}>{errors.name.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-500 font-semibold">생년월일 (선택)</span>
          <input type="date" {...form.register('birthDate')} className={inputCls} />
          {errors.birthDate && <span className={errorCls}>{errors.birthDate.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-500 font-semibold">메모 (선택)</span>
          <textarea {...form.register('memo')} rows={2} className={`${inputCls} resize-none`} />
        </label>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
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
            {isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
