'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateChild } from '@/entities/child';
import { ApiError } from '@/lib/api';
import type { Translate } from '@/shared/lib/i18n';

function createFormSchema(t: Translate) {
  return z.object({
    name: z.string().min(1, t('nameRequired')),
    birthDate: z.string().optional(),
    memo: z.string().optional(),
  });
}

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface Props {
  open: boolean;
  onClose: () => void;
}

const inputCls =
  'rounded-[10px] border border-gray-200 px-4 py-3 text-body text-gray-900 outline-none focus:border-brand';
const errorCls = 'mt-1 text-xs text-danger-strong';

export function CreateChildForm({ open, onClose }: Props) {
  const t = useTranslations('features.createChild');
  const form = useForm<FormData>({
    resolver: zodResolver(createFormSchema(t)),
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
          toast.success(t('createSuccess'));
          router.refresh();
          handleClose();
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : t('createError'));
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
          <span className="text-label text-gray-600 font-semibold">{t('nameLabel')}</span>
          <input
            {...form.register('name')}
            placeholder={t('namePlaceholder')}
            className={inputCls}
          />
          {errors.name && <span className={errorCls}>{errors.name.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-600 font-semibold">{t('birthDateLabel')}</span>
          <input type="date" {...form.register('birthDate')} className={inputCls} />
          {errors.birthDate && <span className={errorCls}>{errors.birthDate.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-600 font-semibold">{t('memoLabel')}</span>
          <textarea
            {...form.register('memo')}
            rows={2}
            placeholder={t('memoPlaceholder')}
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
