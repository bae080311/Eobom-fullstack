# 아키텍처 문서

## 모노레포 구조

```
eobom/
├── apps/
│   ├── web/          # Next.js 15 App Router (PWA)
│   └── api/          # NestJS 10
├── packages/
│   ├── shared/       # 공통 타입, DTO, 열거형
│   └── config/       # ESLint, TypeScript, Prettier 설정
├── prisma/
│   └── schema.prisma # 데이터베이스 스키마
├── docs/             # 프로젝트 문서
└── .github/          # CI/CD, 템플릿
```

## 기술 스택

### 프론트엔드 (apps/web)

| 기술 | 버전 | 역할 |
|------|------|------|
| Next.js | 15.x | React 프레임워크, App Router |
| React | 19.x | UI 라이브러리 |
| Tailwind CSS | 3.x | 유틸리티 CSS |
| @ducanh2912/next-pwa | 10.x | PWA 서비스 워커 |
| TypeScript | 5.7 | 타입 안전성 |

### 백엔드 (apps/api)

| 기술 | 버전 | 역할 |
|------|------|------|
| NestJS | 10.x | Node.js 프레임워크 |
| Prisma | 6.x | ORM |
| PostgreSQL | 16.x | 데이터베이스 |
| class-validator | 0.14.x | 요청 검증 |
| JWT | (Phase 2) | 인증 |
| Swagger | (Phase 2) | API 문서화 |

### 인프라

| 기술 | 역할 |
|------|------|
| Docker Compose | 로컬 PostgreSQL |
| Turborepo | 모노레포 빌드 오케스트레이션 |
| pnpm | 패키지 매니저 |
| GitHub Actions | CI/CD |

## 패키지 의존성 그래프

```
apps/web
  └── @eobom/shared
  └── @eobom/config (dev)

apps/api
  └── @eobom/shared
  └── @eobom/config (dev)
  └── @prisma/client

packages/shared
  └── @eobom/config (dev)
```

## API 통신 구조

```
Browser (PWA)
    │
    │ HTTPS (REST API)
    ▼
Next.js Server (앱 라우터)
    │
    │ HTTP (내부)
    ▼
NestJS API Server
    │
    │ Prisma
    ▼
PostgreSQL
```

## 환경 구성

```
개발: localhost:3000 (web) + localhost:3001 (api) + localhost:5432 (postgres)
스테이징: (Phase 4에서 설계)
프로덕션: (Phase 4에서 설계)
```

## Turborepo 파이프라인

```
build:    shared → api, web (병렬)
dev:      shared build → api, web dev (병렬)  
test:     각 앱 독립 실행
lint:     각 앱 독립 실행
typecheck: shared → api, web (병렬)
```
