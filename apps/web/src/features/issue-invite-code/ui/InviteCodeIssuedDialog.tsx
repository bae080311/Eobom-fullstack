'use client';

import { useTranslations } from 'next-intl';
import type { InviteCodeResponseDto } from '@eobom/shared';

interface Props {
  code: InviteCodeResponseDto | null;
  onClose: () => void;
}

export function InviteCodeIssuedDialog({ code, onClose }: Props) {
  const t = useTranslations('features.issueInviteCode');
  if (!code) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-5 pb-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-title3 font-bold tracking-tighter text-gray-900 m-0">
          {t('issuedTitle')}
        </h2>
        <p className="text-body text-gray-600 m-0 leading-relaxed">{t('issuedDescription')}</p>
        <p className="text-title3 font-bold tracking-wide text-brand text-center bg-brand-softer rounded-xl py-4 m-0">
          {code.code}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="bg-brand text-white rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans"
        >
          {t('confirmButton')}
        </button>
      </div>
    </div>
  );
}
