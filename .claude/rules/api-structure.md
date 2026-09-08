# API (NestJS) 구현 규칙

## 모듈 구조

```
apps/api/src/modules/<name>/
├── <name>.module.ts
├── <name>.controller.ts
├── <name>.service.ts
└── dto/              # shared에 없는 모듈 전용 DTO만
```

## DTO

- 모든 DTO는 `packages/shared/src/dto/`에 먼저 정의 후 임포트
- `apps/api` 안에 중복 타입 정의 금지
- 모든 DTO 필드에 `class-validator` 데코레이터 필수

## 로거

모든 서비스 클래스에 NestJS `Logger`를 반드시 추가한다.

```typescript
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class FooService {
  private readonly logger = new Logger(FooService.name);
}
```

로그 수준 기준:

- `logger.log` — 정상 흐름 (요청 시작, 성공)
- `logger.warn` — 예상 가능한 실패 (인증 오류, 중복, 미인증)
- `logger.error` — 예상치 못한 예외 (DB 오류, 외부 서비스 장애)

## 에러 처리

- 서비스에서 `throw new HttpException(...)` 금지 → NestJS 표준 예외 클래스 사용
  (`NotFoundException`, `ForbiddenException`, `ConflictException` 등)

## 금지

- `any` 타입
- 서비스에서 직접 HTTP 응답 조작
- `packages/shared` 무시하고 로컬 타입 중복 정의
