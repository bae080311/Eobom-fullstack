'use client';

import { useTranslations } from 'next-intl';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const t = useTranslations('shared.confirmDialog');
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-5 pb-8"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-title3 font-bold tracking-tighter text-gray-900 m-0">{title}</h2>
        {description && (
          <p className="text-body text-gray-600 mt-2 leading-relaxed m-0">{description}</p>
        )}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-100 text-gray-900 rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus"
          >
            {cancelLabel ?? t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans text-white disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus ${
              destructive ? 'bg-danger-strong' : 'bg-brand'
            }`}
          >
            {confirmLabel ?? t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
