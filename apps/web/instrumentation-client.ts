// 타입 전용 import는 컴파일 시 지워지므로 번들에 SDK를 끌어오지 않는다.
import type * as SentryNextjs from '@sentry/nextjs';
import { parseSampleRate } from './src/shared/lib/sentry-sample-rate';

/**
 * 브라우저용 Sentry 초기화.
 *
 * `@sentry/nextjs`를 **정적 import 하지 않는다.** 정적으로 넣으면 DSN이 없어도
 * SDK가 모든 페이지의 초기 번들에 들어간다 — 실측으로 First Load JS가
 * 105 kB → 187 kB로 늘었다. 학부모가 모바일에서 쓰는 PWA라 꺼져 있는 기능에
 * 82 kB를 물릴 수 없다.
 *
 * `NEXT_PUBLIC_SENTRY_DSN`은 빌드 시점에 상수로 인라인되므로, 값이 없는 빌드에서는
 * 아래 블록 전체가 죽은 코드로 제거돼 청크 자체가 생기지 않는다. 값이 있으면
 * 별도 async 청크로 분리돼 초기 번들 밖에서 내려온다.
 *
 * 대가: init이 한 틱 늦어져 아주 초기에 터지는 예외는 놓칠 수 있다.
 */

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

type SentryClient = typeof SentryNextjs;

let sentry: SentryClient | null = null;

if (dsn) {
  void import('@sentry/nextjs').then((Sentry) => {
    sentry = Sentry;

    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: parseSampleRate(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE, 0.1),

      // Session Replay는 의도적으로 켜지 않는다. 화면에 아동 이름과 세션 리포트
      // 본문이 그대로 떠 있어 DOM 녹화는 곧 개인정보 유출이다.

      sendDefaultPii: false,

      beforeSend(event) {
        if (event.request) {
          delete event.request.data;
          delete event.request.cookies;
          delete event.request.query_string;
          delete event.request.headers;
        }
        return event;
      },
    });
  });
}

/**
 * Next.js가 클라이언트 라우팅 전환마다 부른다.
 * SDK가 아직(또는 영영) 로드되지 않았으면 아무것도 하지 않는다.
 */
export const onRouterTransitionStart: SentryClient['captureRouterTransitionStart'] = (...args) => {
  sentry?.captureRouterTransitionStart(...args);
};
