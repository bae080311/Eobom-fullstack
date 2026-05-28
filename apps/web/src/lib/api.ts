import ky, { HTTPError, type Options } from 'ky';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Options {
  token?: string;
}

const client = ky.create({ prefix: API_URL });

function buildOptions({ token, ...rest }: RequestOptions = {}): Options {
  if (!token) return rest;
  return { ...rest, headers: { Authorization: `Bearer ${token}`, ...(rest.headers as object) } };
}

async function request<T>(promise: ReturnType<typeof client.get>): Promise<T> {
  try {
    const res = await promise;
    if (res.status === 204) return undefined as T;
    return res.json();
  } catch (err) {
    if (err instanceof HTTPError) {
      const body = await err.response.json().catch(() => ({}));
      const message = Array.isArray(body.message)
        ? body.message.join(', ')
        : (body.message ?? '요청에 실패했습니다.');
      throw new ApiError(message, err.response.status);
    }
    throw err;
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(client.get(path, buildOptions(options))),

  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(client.post(path, { json: body, ...buildOptions(options) })),

  put: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(client.put(path, { json: body, ...buildOptions(options) })),

  patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(client.patch(path, { json: body, ...buildOptions(options) })),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(client.delete(path, buildOptions(options))),
};
