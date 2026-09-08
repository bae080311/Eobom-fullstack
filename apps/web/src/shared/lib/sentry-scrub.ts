/**
 * Sentry로 내보내기 전에 URL·요청 본문에서 개인정보를 지운다.
 *
 * `beforeSend`는 **에러 이벤트만** 통과한다. `tracesSampleRate`가 0보다 크면
 * 트랜잭션과 스팬이 따로 전송되는데, 그쪽 URL 속성에는 쿼리스트링이 그대로
 * 남는다. 그래서 `beforeSendTransaction`·`beforeSendSpan`에도 같은 처리를 건다.
 *
 * `apps/api/src/common/sentry-scrub.ts`와 짝이다 — 패키지 경계 때문에 코드를
 * 공유할 수 없다(`parseSampleRate`도 같은 이유로 양쪽에 있다).
 * **한쪽을 고치면 다른 쪽도 고쳐야 한다.** 실제로 `beforeSend`만 있던 시절
 * 네 곳에 같은 로직을 따로 써서 전부 같은 구멍을 갖고 있었다.
 */

/** URL 문자열에서 쿼리스트링·프래그먼트를 잘라낸다. */
export function stripQuery(value: string): string {
  return value.split(/[?#]/)[0] ?? value;
}

/** Sentry의 요청 데이터에서 우리가 건드리는 부분만 추린 모양. */
interface ScrubbableRequest {
  url?: string;
  data?: unknown;
  cookies?: unknown;
  query_string?: unknown;
  headers?: unknown;
}

/**
 * 이벤트의 `request`에서 본문·쿠키·쿼리·헤더를 지운다.
 * 어느 엔드포인트에서 터졌는지는 `url`·`method`만으로 충분히 좁혀진다.
 */
export function scrubRequest<T extends { request?: ScrubbableRequest }>(event: T): T {
  const request = event.request;
  if (!request) return event;

  delete request.data;
  delete request.cookies;
  delete request.query_string;
  delete request.headers;

  if (typeof request.url === 'string') {
    request.url = stripQuery(request.url);
  }

  return event;
}

/** 쿼리 전용 스팬 속성 — 값 자체가 쿼리라 잘라낼 것이 없고 지워야 한다. */
const QUERY_ONLY_ATTRIBUTES = ['url.query', 'http.query', 'http.request.query'] as const;

/** 값에 쿼리스트링이 붙어 올 수 있는 URL 속성. */
const URL_ATTRIBUTES = ['http.url', 'http.target', 'url.full', 'url.path', 'http.route'] as const;

/**
 * 스팬/트랜잭션의 속성에서 쿼리를 제거한다.
 * 계측이 채우는 키 이름이 SDK 버전에 따라 다르므로 둘 다 훑는다.
 */
export function scrubSpanAttributes(
  data: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!data) return data;

  for (const key of QUERY_ONLY_ATTRIBUTES) {
    delete data[key];
  }

  for (const key of URL_ATTRIBUTES) {
    const value = data[key];
    if (typeof value === 'string') {
      data[key] = stripQuery(value);
    }
  }

  return data;
}
