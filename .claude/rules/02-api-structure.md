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

## 에러 처리

- 서비스에서 `throw new HttpException(...)` 금지 → NestJS 표준 예외 클래스 사용
  (`NotFoundException`, `ForbiddenException`, `ConflictException` 등)

## 금지

- `any` 타입
- 서비스에서 직접 HTTP 응답 조작
- `packages/shared` 무시하고 로컬 타입 중복 정의
