'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { toast } from 'sonner';
import { useUpdateChild } from '@/entities/child';
import { FormModal } from '@/shared/ui';
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
  childId: string;
  name: string;
  birthDate: string | null;
  memo: string | null;
  onClose: () => void;
}

const inputCls =
  'rounded-[10px] border border-gray-200 px-4 py-3 text-body text-gray-900 outline-none focus:border-brand';
const errorCls = 'mt-1 text-xs text-danger-strong';

function defaultsFrom(name: string, birthDate: string | null, memo: string | null): FormData {
  return { name, birthDate: birthDate ? birthDate.slice(0, 10) : '', memo: memo ?? '' };
}

export function EditChildForm({ open, childId, name, birthDate, memo, onClose }: Props) {
  const t = useTranslations('features.manageChild.editForm');
  const formSchema = useMemo(() => createFormSchema(t), [t]);
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
          toast.success(t('updateSuccess'));
          onClose();
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : t('updateError'));
        },
      },
    );
  };

  return (
    <FormModal
      open={open}
      title={t('title')}
      isPending={isPending}
      onSubmit={form.handleSubmit(onSubmit)}
      onClose={onClose}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-label text-gray-600 font-semibold">{t('nameLabel')}</span>
        <input {...form.register('name')} className={inputCls} />
        {errors.name && <span className={errorCls}>{errors.name.message}</span>}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-label text-gray-600 font-semibold">{t('birthDateLabel')}</span>
        <input type="date" {...form.register('birthDate')} className={inputCls} />
        {errors.birthDate && <span className={errorCls}>{errors.birthDate.message}</span>}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-label text-gray-600 font-semibold">{t('memoLabel')}</span>
        <textarea {...form.register('memo')} rows={2} className={`${inputCls} resize-none`} />
      </label>
    </FormModal>
  );
}
