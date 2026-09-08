import * as Sentry from '@sentry/nextjs';
import { parseSampleRate } from './src/shared/lib/sentry-sample-rate';

// middleware.ts가 edge 런타임에서 돈다.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),
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
