import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Providers } from './providers';
import './globals.css';

const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '45 920',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app.common');
  return {
    title: {
      default: t('siteName'),
      template: t('titleTemplate'),
    },
    description: t('siteDescription'),
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: t('siteName'),
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#3D7A6B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // `env(safe-area-inset-*)`는 viewport-fit=cover 일 때만 0이 아닌 값을 준다.
  // 이게 없어서 하단 탭바의 `.safe-area-inset-bottom`이 아무 일도 하지 않았고,
  // 노치 기기·웹뷰에서 홈 인디케이터에 탭바가 가렸다.
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html lang={locale} className={pretendard.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
