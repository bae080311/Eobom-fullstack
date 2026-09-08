import { describe, it, expect } from 'vitest';

import { stripQuery, scrubRequest, scrubSpanAttributes } from './sentry-scrub';

describe('stripQuery', () => {
  it('쿼리스트링과 프래그먼트를 잘라낸다', () => {
    expect(stripQuery('/schedules?childId=abc')).toBe('/schedules');
    expect(stripQuery('https://eobom.dev/a/b?q=1#frag')).toBe('https://eobom.dev/a/b');
  });

  it('쿼리가 없으면 그대로 둔다', () => {
    expect(stripQuery('/home')).toBe('/home');
  });
});

describe('scrubRequest', () => {
  it('본문·쿠키·쿼리·헤더를 지우고 url은 남긴다', () => {
    const event = {
      request: {
        url: '/schedules?childName=홍길동',
        method: 'GET',
        data: { memo: '조음 훈련 메모' },
        cookies: { access: 'jwt' },
        query_string: 'childName=홍길동',
        headers: { authorization: 'Bearer x' },
      },
    };

    const result = scrubRequest(event);

    expect(result.request).toEqual({ url: '/schedules', method: 'GET' });
    // 직렬화까지 확인한다 — 키만 지워도 값이 남는 경우를 놓치지 않기 위해.
    expect(JSON.stringify(result)).not.toContain('홍길동');
    expect(JSON.stringify(result)).not.toContain('조음 훈련 메모');
  });

  it('request가 없으면 그대로 반환한다', () => {
    const event = { transaction: '/home' } as { request?: Record<string, unknown> };
    expect(scrubRequest(event)).toBe(event);
  });
});

describe('scrubSpanAttributes', () => {
  it('쿼리 전용 속성을 지운다', () => {
    const data = { 'url.query': 'note=SECRET', 'http.query': 'a=1', 'http.method': 'GET' };

    expect(scrubSpanAttributes(data)).toEqual({ 'http.method': 'GET' });
  });

  it('URL 속성에서 쿼리만 잘라낸다', () => {
    const data = {
      'http.url': 'https://api.eobom.dev/api/schedules?childId=abc',
      'url.full': 'https://eobom.dev/schedule/1?note=SECRET',
    };

    expect(scrubSpanAttributes(data)).toEqual({
      'http.url': 'https://api.eobom.dev/api/schedules',
      'url.full': 'https://eobom.dev/schedule/1',
    });
  });

  it('문자열이 아닌 값은 건드리지 않는다', () => {
    const data = { 'http.url': 42, 'http.status_code': 200 };
    expect(scrubSpanAttributes(data)).toEqual({ 'http.url': 42, 'http.status_code': 200 });
  });

  it('undefined는 그대로 반환한다', () => {
    expect(scrubSpanAttributes(undefined)).toBeUndefined();
  });
});
