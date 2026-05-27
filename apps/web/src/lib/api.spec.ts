import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiError, api } from './api';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe('ApiError', () => {
  it('sets name, message, and status', () => {
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
    mockFetch.mockReset();
  });

  it('get — resolves with parsed JSON on 200', async () => {
    mockFetch.mockResolvedValue(makeResponse({ id: 1 }));
    const result = await api.get<{ id: number }>('/users');
    expect(result).toEqual({ id: 1 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/users'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('post — sends JSON body and resolves on 201', async () => {
    mockFetch.mockResolvedValue(makeResponse({ id: 2 }, 201));
    await api.post('/items', { name: 'test' });
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(opts.body).toBe(JSON.stringify({ name: 'test' }));
    expect((opts.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('returns undefined on 204 without parsing body', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204, json: vi.fn() });
    const result = await api.delete('/items/1');
    expect(result).toBeUndefined();
  });

  it('throws ApiError with server message on non-OK response', async () => {
    mockFetch.mockResolvedValue(makeResponse({ message: '이미 존재합니다.' }, 409));
    await expect(api.post('/items', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: '이미 존재합니다.',
    });
  });

  it('throws ApiError with fallback message when JSON parse fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('parse error')),
    });
    await expect(api.get('/crash')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: '요청에 실패했습니다.',
    });
  });

  it('attaches Authorization header when token is provided', async () => {
    mockFetch.mockResolvedValue(makeResponse({}));
    await api.get('/me', { token: 'abc123' });
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)['Authorization']).toBe('Bearer abc123');
  });

  it('omits Authorization header when no token', async () => {
    mockFetch.mockResolvedValue(makeResponse({}));
    await api.get('/me');
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });
});
