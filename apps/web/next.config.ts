import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
});

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  transpilePackages: ['@eobom/shared'],
  webpack(config) {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

// Sentry 래퍼가 가장 바깥이어야 한다 — 다른 플러그인이 만들어 낸 최종 설정을
// 받아 소스맵·번들 설정을 얹는 구조다.
export default withSentryConfig(withPWA(withNextIntl(nextConfig)), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // DSN·인증 토큰이 없는 로컬·CI 빌드에서 경고를 쏟아내지 않게 한다.
  silent: !process.env.CI,

  // 소스맵 업로드는 SENTRY_AUTH_TOKEN이 있을 때만 한다. 없으면 조용히 건너뛴다.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Sentry SDK의 디버그 로거를 프로덕션 번들에서 덜어낸다.
  disableLogger: true,
});
