'use client';

import { useTranslations } from 'next-intl';
import { useModalDialog } from '@/shared/lib/useModalDialog';

interface Props {
  open: boolean;
  password: string;
  error: string | null;
  isPending: boolean;
  isTherapist: boolean;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function DeleteAccountDialog({
  open,
  password,
  error,
  isPending,
  isTherapist,
  onPasswordChange,
  onSubmit,
  onCancel,
}: Props) {
  const t = useTranslations('features.deleteAccount');
  const { ref, titleId, onKeyDown } = useModalDialog({
    open,
    onClose: onCancel,
    locked: isPending,
  });
  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    onPasswordChange(e.target.value);
  }

  function stopPropagation(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-5 pb-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onCancel}
      onKeyDown={onKeyDown}
    >
      <form
        onSubmit={handleSubmit}
        onClick={stopPropagation}
        className="w-full max-w-md rounded-2xl bg-white p-6 flex flex-col gap-4"
      >
        <h2 id={titleId} className="text-title3 font-bold tracking-tighter text-gray-900 m-0">
          {t('title')}
        </h2>

        <div className="flex flex-col gap-2">
          <p className="text-body text-gray-600 leading-relaxed m-0">{t('warning')}</p>
          <p className="text-body2 text-gray-600 leading-relaxed m-0">
            {isTherapist ? t('therapistNotice') : t('parentNotice')}
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-gray-600 font-semibold">{t('passwordLabel')}</span>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            autoComplete="current-password"
            placeholder={t('passwordPlaceholder')}
            className="rounded-[10px] border border-gray-200 px-4 py-3 text-body text-gray-900 outline-none focus:border-brand"
          />
        </label>

        {error && (
          <p role="alert" className="text-body2 text-danger-strong m-0">
            {error}
          </p>
        )}

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 bg-gray-100 text-gray-900 rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-danger-strong text-white rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus"
          >
            {isPending ? t('deleting') : t('confirm')}
          </button>
        </div>
      </form>
    </div>
  );
}
