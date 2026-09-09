import { Injectable } from '@nestjs/common';
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

/**
 * 성공 응답을 `{ data: ... }` 로 감싼다 (레이어 5 §5.1).
 *
 * 이전에는 `report` 모듈만 서비스에서 손으로 감싸고 나머지 모듈은 DTO를 그대로
 * 돌려줬다 — 즉 명세를 지키는 쪽이 소수였다. 전역 인터셉터로 옮겨 한 군데서 처리한다.
 *
 * `undefined`는 감싸지 않는다. 두 경우가 여기에 해당한다.
 *  - 204 No Content 라우트 (logout, revoke, leave, read-all) — 본문이 없어야 한다
 *  - `@Res()`로 응답을 직접 쓰는 라우트 (`GET /health`) — 프로브가 읽는 형식을
 *    바꾸면 안 되므로 감싸지 않는 것이 맞다
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { data: T } | undefined> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<{ data: T } | undefined> {
    return next.handle().pipe(map((value) => (value === undefined ? undefined : { data: value })));
  }
}
