'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateChild } from '@/entities/child';
import { ApiError } from '@/lib/api';

const formSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  birthDate: z.string().optional(),
  memo: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

const inputCls =
  'rounded-[10px] border border-gray-200 px-4 py-3 text-body text-gray-900 outline-none focus:border-brand';
const errorCls = 'mt-1 text-xs text-danger';

export function CreateChildForm({ open, onClose }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', birthDate: '', memo: '' },
  });
  const { mutate, isPending } = useCreateChild();
  const router = useRouter();

  if (!open) return null;

  const { errors } = form.formState;

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: FormData) => {
    mutate(
      {
        name: data.name.trim(),
        birthDate: data.birthDate || undefined,
        memo: data.memo?.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('아동이 등록되었습니다');
          router.refresh();
          handleClose();
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : '아동 등록에 실패했습니다');
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
        <h2 className="text-title3 font-bold tracking-tighter text-gray-900 m-0">아동 등록</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-500 font-semibold">이름</span>
          <input {...form.register('name')} placeholder="예: 홍길동" className={inputCls} />
          {errors.name && <span className={errorCls}>{errors.name.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-500 font-semibold">생년월일 (선택)</span>
          <input type="date" {...form.register('birthDate')} className={inputCls} />
          {errors.birthDate && <span className={errorCls}>{errors.birthDate.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-500 font-semibold">메모 (선택)</span>
          <textarea
            {...form.register('memo')}
            rows={2}
            placeholder="예: 조음 관련 주의"
            className={`${inputCls} resize-none`}
          />
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
            {isPending ? '등록 중...' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
