'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: Props) {
  const t = useTranslations('app.common');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-gray-50 min-h-screen font-sans antialiased flex flex-col items-center justify-center px-8 text-center">
      <div className="text-5xl">⚠️</div>
      <h1 className="text-title font-bold tracking-tighter text-gray-900 mt-5">
        {t('errorTitle')}
      </h1>
      <p className="text-body text-gray-600 mt-2">{t('errorDescription')}</p>
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-body font-semibold text-white"
      >
        {t('retryButton')}
      </button>
    </div>
  );
}
