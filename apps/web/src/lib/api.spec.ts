import { describe, it, expect, beforeEach, vi } from 'vitest';

// vi.mock 팩토리는 파일 최상단으로 호이스팅되므로
// 팩토리 안에서 사용할 변수는 vi.hoisted()로 먼저 정의해야 한다.
const { kyMethods, MockHTTPError } = vi.hoisted(() => {
  class MockHTTPError extends Error {
    response: { status: number; json: () => Promise<unknown> };
    constructor(response: { status: number; json: () => Promise<unknown> }) {
      super('HTTPError');
      this.name = 'HTTPError';
      this.response = response;
    }
  }
  return {
    kyMethods: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    MockHTTPError,
  };
});

// ky v2 + jsdom AbortSignal 불일치 문제를 피하기 위해 ky 모듈 자체를 모킹한다.
vi.mock('ky', () => ({
  default: { create: () => kyMethods },
  HTTPError: MockHTTPError,
}));

import { ApiError, api } from './api';

function makeKyRes(body: unknown, status = 200) {
  return { status, json: vi.fn().mockResolvedValue(body) };
}

describe('ApiError', () => {
  it('name·message·status 를 올바르게 설정한다', () => {
    const err = new ApiError('not found', 404);
    expect(err.name).toBe('ApiError');
    expect(err.message).toBe('not found');
    expect(err.status).toBe(404);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
  });
});

describe('api', () => {
  beforeEach(() => {
    Object.values(kyMethods).forEach((m) => m.mockReset());
  });

  it('get — 200 응답의 JSON을 파싱해 반환한다', async () => {
    kyMethods.get.mockResolvedValue(makeKyRes({ id: 1 }));
    const result = await api.get<{ id: number }>('/users');
    expect(result).toEqual({ id: 1 });
    expect(kyMethods.get).toHaveBeenCalledWith('/users', expect.any(Object));
  });

  it('post — JSON body를 포함해 ky.post를 호출한다', async () => {
    kyMethods.post.mockResolvedValue(makeKyRes({ id: 2 }, 201));
    await api.post('/items', { name: 'test' });
    const [, opts] = kyMethods.post.mock.calls[0] as [string, Record<string, unknown>];
    expect(opts.json).toEqual({ name: 'test' });
  });

  it('204 응답은 body 파싱 없이 undefined를 반환한다', async () => {
    kyMethods.delete.mockResolvedValue({ status: 204, json: vi.fn() });
    const result = await api.delete('/items/1');
    expect(result).toBeUndefined();
  });

  it('non-OK 응답 시 서버 메시지로 ApiError를 던진다', async () => {
    const err = new MockHTTPError({
      status: 409,
      json: () => Promise.resolve({ message: '이미 존재합니다.' }),
    });
    kyMethods.post.mockRejectedValue(err);
    await expect(api.post('/items', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: '이미 존재합니다.',
    });
  });

  it('JSON 파싱 실패 시 fallback 메시지로 ApiError를 던진다', async () => {
    const err = new MockHTTPError({
      status: 500,
      json: () => Promise.reject(new Error('parse error')),
    });
    kyMethods.get.mockRejectedValue(err);
    await expect(api.get('/crash')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: '요청에 실패했습니다.',
    });
  });

  it('token 전달 시 Authorization 헤더를 포함한다', async () => {
    kyMethods.get.mockResolvedValue(makeKyRes({}));
    await api.get('/me', { token: 'abc123' });
    const [, opts] = kyMethods.get.mock.calls[0] as [string, { headers?: Record<string, string> }];
    expect(opts.headers?.['Authorization']).toBe('Bearer abc123');
  });

  it('token 미전달 시 Authorization 헤더가 없다', async () => {
    kyMethods.get.mockResolvedValue(makeKyRes({}));
    await api.get('/me');
    const [, opts] = kyMethods.get.mock.calls[0] as [string, { headers?: Record<string, string> }];
    expect(opts?.headers?.['Authorization']).toBeUndefined();
  });

  it('서버가 배열 메시지를 반환하면 join해서 ApiError로 던진다', async () => {
    const err = new MockHTTPError({
      status: 400,
      json: () => Promise.resolve({ message: ['필드1 오류', '필드2 오류'] }),
    });
    kyMethods.post.mockRejectedValue(err);
    await expect(api.post('/items', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: '필드1 오류, 필드2 오류',
    });
  });
});
