import { describe, it, expect } from 'vitest';
import { of, lastValueFrom } from 'rxjs';
import type { CallHandler, ExecutionContext } from '@nestjs/common';

import { TransformInterceptor } from './transform.interceptor.js';

const run = async <T>(value: T) => {
  const interceptor = new TransformInterceptor<T>();
  const next: CallHandler<T> = { handle: () => of(value) };

  return lastValueFrom(interceptor.intercept({} as ExecutionContext, next));
};

describe('TransformInterceptor', () => {
  it('객체를 data로 감싼다', async () => {
    await expect(run({ id: 'u1' })).resolves.toEqual({ data: { id: 'u1' } });
  });

  it('배열도 감싼다 — 목록 응답이 최상위 배열로 나가지 않게 한다', async () => {
    await expect(run([{ id: 'a' }, { id: 'b' }])).resolves.toEqual({
      data: [{ id: 'a' }, { id: 'b' }],
    });
  });

  // 리포트 조회는 "없음"을 404가 아니라 null로 표현한다 (레이어 5 §5.10).
  it('null은 data: null로 감싼다', async () => {
    await expect(run(null)).resolves.toEqual({ data: null });
  });

  // 204 라우트와 @Res()로 직접 응답을 쓰는 라우트(GET /health)가 여기에 해당한다.
  it('undefined는 감싸지 않는다', async () => {
    await expect(run(undefined)).resolves.toBeUndefined();
  });

  it('falsy 값도 감싼다 — undefined만 예외다', async () => {
    await expect(run(0)).resolves.toEqual({ data: 0 });
    await expect(run('')).resolves.toEqual({ data: '' });
    await expect(run(false)).resolves.toEqual({ data: false });
  });
});
