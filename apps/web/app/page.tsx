import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const [t, tLanding] = await Promise.all([
    getTranslations('app.common'),
    getTranslations('app.landing'),
  ]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-brand">{t('siteName')}</h1>
          <p className="mt-3 text-gray-600 text-lg">{tLanding('tagline')}</p>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed">{tLanding('description')}</p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full py-3 px-6 bg-brand text-white rounded-xl font-medium hover:bg-brand-hover transition-colors"
          >
            {tLanding('loginButton')}
          </Link>
          <Link
            href="/register"
            className="block w-full py-3 px-6 border border-brand text-brand rounded-xl font-medium hover:bg-brand-softer transition-colors"
          >
            {tLanding('signupButton')}
          </Link>
        </div>
      </div>
    </main>
  );
}
