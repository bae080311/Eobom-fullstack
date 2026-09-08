import * as Sentry from '@sentry/nextjs';
import { parseSampleRate } from './src/shared/lib/sentry-sample-rate';

// SENTRY_DSN이 없으면 init 자체를 건너뛴다 — 로컬·CI의 기본 상태다.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),

    // 아동 이름·치료 메모가 오가는 서비스다. IP·쿠키·헤더를 기본 수집하지 않는다.
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
}
