const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchApi<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: '요청에 실패했습니다.' }));
    throw new Error(error.message || '요청에 실패했습니다.');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string, options?: FetchOptions) =>
    fetchApi<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, body: unknown, options?: FetchOptions) =>
    fetchApi<T>(path, { method: 'POST', body: JSON.stringify(body), ...options }),

  put: <T>(path: string, body: unknown, options?: FetchOptions) =>
    fetchApi<T>(path, { method: 'PUT', body: JSON.stringify(body), ...options }),

  patch: <T>(path: string, body: unknown, options?: FetchOptions) =>
    fetchApi<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),

  delete: <T>(path: string, options?: FetchOptions) =>
    fetchApi<T>(path, { method: 'DELETE', ...options }),
};
