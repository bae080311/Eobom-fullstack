import * as Sentry from '@sentry/nextjs';
import { parseSampleRate } from './src/shared/lib/sentry-sample-rate';
import { scrubRequest, scrubSpanAttributes, stripQuery } from './src/shared/lib/sentry-scrub';

// middleware.ts가 edge 런타임에서 돈다.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),
    sendDefaultPii: false,

    // beforeSend는 에러 이벤트만 통과한다 — 트랜잭션·스팬도 따로 훑어야 한다.
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
