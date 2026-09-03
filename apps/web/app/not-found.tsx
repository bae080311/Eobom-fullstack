import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('app.common');

  return (
    <div className="bg-gray-50 min-h-screen font-sans antialiased flex flex-col items-center justify-center px-8 text-center">
      <div className="text-5xl">🔍</div>
      <h1 className="text-title font-bold tracking-tighter text-gray-900 mt-5">
        {t('notFoundTitle')}
      </h1>
      <p className="text-body text-gray-600 mt-2">{t('notFoundDescription')}</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-body font-semibold text-white no-underline"
      >
        {t('goHomeButton')}
      </Link>
    </div>
  );
}
