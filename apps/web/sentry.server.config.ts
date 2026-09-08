import * as Sentry from '@sentry/nextjs';
import { parseSampleRate } from './src/shared/lib/sentry-sample-rate';
import { scrubRequest, scrubSpanAttributes, stripQuery } from './src/shared/lib/sentry-scrub';

// SENTRY_DSN이 없으면 init 자체를 건너뛴다 — 로컬·CI의 기본 상태다.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),

    // 아동 이름·치료 메모가 오가는 서비스다. IP·쿠키·헤더를 기본 수집하지 않는다.
    sendDefaultPii: false,

    // 훅이 세 개인 이유: beforeSend는 **에러 이벤트만** 통과한다.
    // tracesSampleRate가 0보다 크면 트랜잭션·스팬이 따로 전송되고,
    // 그쪽 URL 속성에는 쿼리스트링이 그대로 남는다.
    beforeSend(event) {
      return scrubRequest(event);
    },

    beforeSendTransaction(event) {
      scrubRequest(event);
      if (event.transaction) {
        event.transaction = stripQuery(event.transaction);
      }
      scrubSpanAttributes(event.contexts?.trace?.data);
      return event;
    },

    beforeSendSpan(span) {
      scrubSpanAttributes(span.data);
      if (span.description) {
        span.description = stripQuery(span.description);
      }
      return span;
    },
  });
}
