import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '../../../src/features/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app.auth');
  return { title: t('loginTitle') };
}

export default async function LoginPage() {
  const t = await getTranslations('app.auth');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{t('loginTitle')}</h1>
          <p className="mt-2 text-gray-600 text-sm">{t('loginSubtitle')}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
