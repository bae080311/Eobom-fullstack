import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '../../../src/features/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app.auth');
  return { title: t('loginTitle') };
}

/**
 * 로그인 — 랜딩과 같은 좌측 정렬 문법을 쓴다.
 *
 * 가운데 띄운 흰 카드를 걷어냈다. 입력이 세 개뿐인 화면에서 카드는 경계를 하나 더
 * 그을 뿐 아무것도 구분하지 않는다. 페이지 바탕을 흰색으로 두고 필드가 바로
 * 앉게 하는 편이 조용하고, 랜딩에서 넘어온 사람에게 같은 화면의 연속으로 읽힌다.
 */
export default async function LoginPage() {
  const [t, tCommon] = await Promise.all([
    getTranslations('app.auth'),
    getTranslations('app.common'),
  ]);

  return (
    <main className="min-h-screen bg-white px-6 pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="text-eyebrow font-bold text-brand no-underline focus-visible:outline-none focus-visible:shadow-focus rounded-sm"
        >
          {tCommon('siteName')}
        </Link>

        <h1 className="mt-5 text-[28px] leading-tight tracking-tighter font-extrabold text-gray-900">
          {t('loginTitle')}
        </h1>
        <p className="mt-2 text-callout text-gray-600">{t('loginSubtitle')}</p>

        <div className="mt-9">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
