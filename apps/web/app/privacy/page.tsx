import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { OPERATOR } from '@/shared/lib/operator';
import { PrivacyPolicy } from '@/widgets/privacy-policy';
import type { OperatorLabels, PrivacySection } from '@/widgets/privacy-policy';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app.privacy');
  return { title: t('title'), description: t('metaDescription') };
}

/**
 * 개인정보처리방침 — 비로그인 공개 화면.
 *
 * 로그인 뒤에 두면 안 된다. App Store 심사와 정보주체 모두 계정 없이 이 문서에
 * 닿을 수 있어야 하고, 앱 설치 전에 읽는 것이 본래 목적이다.
 */
export default async function PrivacyPage() {
  const t = await getTranslations('app.privacy');
  const sections = t.raw('sections') as PrivacySection[];
  const operatorLabels = t.raw('operatorLabels') as OperatorLabels;

  return (
    <main className="min-h-screen bg-gray-50 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="text-eyebrow font-bold text-brand no-underline focus-visible:outline-none focus-visible:shadow-focus rounded-sm"
        >
          {t('backToHome')}
        </Link>

        <h1 className="mt-4 text-title font-extrabold tracking-tighter text-gray-900">
          {t('title')}
        </h1>
        <p className="mt-2 text-body2 font-medium text-gray-700">
          {t('effectiveDateLabel')} · {t('effectiveDate')}
        </p>

        <div className="mt-9">
          <PrivacyPolicy
            sections={sections}
            operator={OPERATOR}
            operatorLabels={operatorLabels}
            operatorPending={t('operatorPending')}
          />
        </div>
      </div>
    </main>
  );
}
