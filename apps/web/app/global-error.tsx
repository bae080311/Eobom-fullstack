'use client';

import { useEffect } from 'react';
import './globals.css';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 루트 레이아웃 자체가 터졌을 때만 뜬다. 이때는 레이아웃이 통째로 대체되므로
 * `NextIntlClientProvider`도 없다 — `useTranslations`를 쓸 수 없어 문구를 직접 박는다.
 * (일반적인 렌더 오류는 `app/error.tsx`가 잡고, 그쪽은 i18n을 쓴다.)
 */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);

    // Sentry는 동적으로만 불러온다 — instrumentation-client.ts와 같은 이유로
    // 정적 import는 초기 번들을 82 kB 불린다. 여기는 에러 경로라 지연이 무해하다.
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      void import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error);
      });
    }
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div className="bg-gray-50 min-h-screen font-sans antialiased flex flex-col items-center justify-center px-8 text-center">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-title font-bold tracking-tighter text-gray-900 mt-5">
            문제가 발생했어요
          </h1>
          <p className="text-body text-gray-600 mt-2">
            잠시 후 다시 시도해주세요. 계속 반복되면 담당 치료사에게 알려주세요.
          </p>
          <button
            onClick={reset}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-body font-semibold text-white"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
