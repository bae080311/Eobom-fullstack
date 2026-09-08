import * as Sentry from '@sentry/nestjs';
import { scrubRequest, scrubSpanAttributes, stripQuery } from './common/sentry-scrub.js';

/**
 * Sentry 초기화.
 *
 * `main.ts`에서 **가장 먼저** import되어야 한다 — 계측이 다른 모듈보다 먼저 붙어야
 * http·DB 호출을 감쌀 수 있다. `@sentry/nestjs`는 OpenTelemetry 위에 올라가 있어
 * 로드맵의 "Sentry / OpenTelemetry 도입" 항목을 함께 만족한다.
 *
 * `SENTRY_DSN`이 없으면 아무것도 하지 않는다 — 로컬·CI·e2e의 기본 상태다.
 *
 * 여기는 DI 컨테이너 바깥이라 `ConfigService`를 쓸 수 없다(쓸 수 있어도 타입 변환은
 * 해 주지 않는다). 숫자 변환은 직접 한다.
 */

/** 0~1 범위를 벗어나거나 숫자가 아니면 기본값으로 되돌린다. */
export const parseSampleRate = (raw: string | undefined, fallback: number): number => {
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) return fallback;
  return parsed;
};

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),

    // 아동 이름·치료 메모가 오가는 API다. IP·쿠키·헤더를 기본 수집하지 않는다.
    sendDefaultPii: false,

    // sendDefaultPii=false로도 요청 본문·쿼리는 남을 수 있다. 아동 이름이나
    // 세션 메모를 그대로 담을 수 있으므로 통째로 지운다. 어느 엔드포인트에서
    // 터졌는지는 url·method만으로 충분히 좁혀진다.
    //
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
