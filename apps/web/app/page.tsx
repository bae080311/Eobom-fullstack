import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

/**
 * 랜딩 — 비로그인 공개 화면.
 *
 * 가운데 쌓기를 하지 않는다. 좌측 정렬 비대칭 구성으로 문장을 먼저 읽히고,
 * 이 제품이 실제로 해 주는 일(다음 수업을 한눈에 보여주는 것)을 **말로 설명하는
 * 대신 그대로 보여준다.** 아래 진한 초록 면이 학부모가 앱을 켰을 때 보는 바로 그
 * 화면이고, 앱 전체에서 쓰는 시간 축 언어의 첫 등장이다.
 */
export default async function HomePage() {
  const [t, tLanding] = await Promise.all([
    getTranslations('app.common'),
    getTranslations('app.landing'),
  ]);

  return (
    <main className="min-h-screen bg-gray-50 px-6 pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-md">
        <p className="rise text-eyebrow font-bold text-brand">{t('siteName')}</p>

        <h1
          className="rise mt-5 text-[34px] leading-[1.22] tracking-tighter font-extrabold text-gray-900 text-balance"
          style={{ '--rise-delay': '60ms' } as React.CSSProperties}
        >
          {tLanding('tagline')}
        </h1>

        <p
          className="rise mt-4 text-callout leading-relaxed text-gray-600"
          style={{ '--rise-delay': '120ms' } as React.CSSProperties}
        >
          {tLanding('description')}
        </p>

        {/* 제품의 핵심 순간을 그대로 보여준다 — 설명보다 빠르다 */}
        <figure
          className="rise mt-10 m-0"
          style={{ '--rise-delay': '200ms' } as React.CSSProperties}
        >
          <figcaption className="text-eyebrow font-semibold text-gray-700 mb-2.5">
            {tLanding('previewEyebrow')}
          </figcaption>
          <div className="rounded-[22px] bg-brand-ground text-white px-[22px] pt-5 pb-[22px]">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-eyebrow font-semibold text-white/70">
                {tLanding('previewDow')}
              </span>
              <span className="text-eyebrow font-bold text-white/90">
                {tLanding('previewUntil')}
              </span>
            </div>
            <div className="mt-3 text-time font-black tabular-nums">{tLanding('previewTime')}</div>
            <div className="mt-2.5 text-callout font-semibold text-white/90">
              {tLanding('previewTitle')}
            </div>
            <div className="mt-4 pt-4 border-t border-white/15 text-body2 text-white/70">
              {tLanding('previewTherapist')}
            </div>
          </div>
        </figure>

        <div
          className="rise mt-10 flex flex-col items-start gap-5"
          style={{ '--rise-delay': '280ms' } as React.CSSProperties}
        >
          <Link
            href="/login"
            className="w-full rounded-[10px] bg-brand py-3.5 px-6 text-center text-callout font-bold text-white no-underline transition-colors hover:bg-brand-hover active:bg-brand-press focus-visible:outline-none focus-visible:shadow-focus"
          >
            {tLanding('loginButton')}
          </Link>
          <Link
            href="/register"
            className="text-body font-semibold text-gray-700 underline underline-offset-4 decoration-gray-300 transition-colors hover:text-brand hover:decoration-brand focus-visible:outline-none focus-visible:shadow-focus rounded-sm"
          >
            {tLanding('signupButton')}
          </Link>
        </div>

        {/* 개인정보처리방침은 계정 없이 닿을 수 있어야 한다 — 스토어 심사와 정보주체 모두
            설치·가입 전에 읽는다. 랜딩이 앱의 유일한 공개 진입점이라 여기 둔다. */}
        <footer
          className="rise mt-14 border-t border-gray-200 pt-5"
          style={{ '--rise-delay': '340ms' } as React.CSSProperties}
        >
          <Link
            href="/privacy"
            className="text-body2 font-medium text-gray-700 underline underline-offset-4 decoration-gray-300 transition-colors hover:text-brand hover:decoration-brand focus-visible:outline-none focus-visible:shadow-focus rounded-sm"
          >
            {tLanding('privacyLink')}
          </Link>
        </footer>
      </div>
    </main>
  );
}
