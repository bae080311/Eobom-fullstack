import * as Sentry from '@sentry/nextjs';

/**
 * Next.js가 서버·edge 런타임 부팅 시 한 번 부른다.
 * 런타임마다 설정 파일이 달라 동적 import로 갈라 넣는다.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// App Router의 서버 컴포넌트·라우트 핸들러에서 터진 예외를 Sentry로 넘긴다.
export const onRequestError = Sentry.captureRequestError;
