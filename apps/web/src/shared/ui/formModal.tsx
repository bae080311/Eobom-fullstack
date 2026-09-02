'use client';

import type { FormEvent, ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  isPending?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export function FormModal({
  open,
  title,
  children,
  isPending = false,
  submitDisabled = false,
  submitLabel = '저장',
  pendingLabel = '저장 중...',
  cancelLabel = '취소',
  onSubmit,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-5 pb-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 flex flex-col gap-4"
      >
        <h2 className="text-title3 font-bold tracking-tighter text-gray-900 m-0">{title}</h2>

        {children}

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 bg-gray-100 text-gray-900 rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={isPending || submitDisabled}
            className="flex-1 bg-brand text-white rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus"
          >
            {isPending ? pendingLabel : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
