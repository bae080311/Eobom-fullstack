import { getRequestConfig } from 'next-intl/server';

// 다국어 라우팅 없이 단일 'ko' 로케일만 제공한다.
// 실제 다국어 확장 시 locale을 쿠키/헤더에서 판별하도록 이 파일만 바꾸면 된다.
const locale = 'ko';

export default getRequestConfig(async () => ({
  locale,
  messages: (await import(`../../messages/${locale}.json`)).default,
}));
