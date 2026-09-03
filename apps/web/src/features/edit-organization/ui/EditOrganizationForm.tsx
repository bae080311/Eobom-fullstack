'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { toast } from 'sonner';
import { useUpdateOrganization } from '@/entities/organization';
import { ApiError } from '@/lib/api';
import type { Translate } from '@/shared/lib/i18n';

function createFormSchema(t: Translate) {
  return z.object({
    name: z.string().min(1, t('orgNameRequired')),
  });
}

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface Props {
  open: boolean;
  orgId: string;
  name: string;
  onClose: () => void;
}

const inputCls =
  'rounded-[10px] border border-gray-200 px-4 py-3 text-body text-gray-900 outline-none focus:border-brand';
const errorCls = 'mt-1 text-xs text-danger-strong';

export function EditOrganizationForm({ open, orgId, name, onClose }: Props) {
  const t = useTranslations('features.editOrganization');
  const router = useRouter();
  const formSchema = useMemo(() => createFormSchema(t), [t]);
  const form = useForm<FormData>({ resolver: zodResolver(formSchema), defaultValues: { name } });
  const { mutate, isPending } = useUpdateOrganization(orgId);

  useEffect(() => {
    if (open) form.reset({ name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, name]);

  if (!open) return null;

  const { errors } = form.formState;

  const onSubmit = (data: FormData) => {
    mutate(
      { name: data.name.trim() },
      {
        onSuccess: () => {
          toast.success(t('updateSuccess'));
          onClose();
          router.refresh();
        },
        onError: (err) => {
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
      onClick={onClose}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 flex flex-col gap-4"
      >
        <h2 className="text-title3 font-bold tracking-tighter text-gray-900 m-0">{t('title')}</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-600 font-semibold">{t('orgNameLabel')}</span>
          <input {...form.register('name')} className={inputCls} />
          {errors.name && <span className={errorCls}>{errors.name.message}</span>}
        </label>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
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
