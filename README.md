# 이어봄 (Eobom)

> 치료사와 학부모가 치료 일정을 함께 관리하는 서비스

[![CI](https://github.com/bae080311/Eobom-fullstack/actions/workflows/ci.yml/badge.svg)](https://github.com/bae080311/Eobom-fullstack/actions/workflows/ci.yml)

## 소개

**이어봄**은 언어치료사와 학부모가 치료 일정을 실시간으로 공유하고, 일정 변경/취소를 즉시 확인할 수 있는 PWA 서비스입니다.

## 프로젝트 구조

```
eobom/
├── apps/
│   ├── web/          # Next.js 15 App Router (PWA)
│   └── api/          # NestJS 10 REST API
├── packages/
│   ├── shared/       # 공통 타입, DTO, 열거형
│   └── config/       # ESLint, TypeScript, Prettier 설정
├── prisma/
│   └── schema.prisma # 데이터베이스 스키마
├── docs/             # 프로젝트 문서
└── .github/          # CI/CD, 템플릿
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| 모노레포 | pnpm workspace + Turborepo |
| 프론트엔드 | Next.js 15, React 19, Tailwind CSS, PWA |
| 백엔드 | NestJS 10, Prisma 6 |
| 데이터베이스 | PostgreSQL 16 |
| 언어 | TypeScript 5.7 |

## 빠른 시작

### 사전 요구사항

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker Desktop

### 설치

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env

# 데이터베이스 기동
docker compose up -d

# Prisma 마이그레이션
pnpm db:migrate

# 개발 서버 실행 (web: 3000, api: 3001)
pnpm dev
```

## 주요 명령어

```bash
# 개발
pnpm dev              # 전체 개발 서버 실행
pnpm build            # 전체 빌드
pnpm lint             # 린트 검사
pnpm typecheck        # 타입 검사
pnpm test             # 테스트 실행

# 특정 앱만 실행
pnpm --filter @eobom/web dev
pnpm --filter @eobom/api dev

# 데이터베이스
pnpm db:migrate       # 마이그레이션 실행
pnpm db:generate      # Prisma 클라이언트 재생성
pnpm db:studio        # Prisma Studio 실행
pnpm db:reset         # DB 초기화 (개발용)
```

## 문서

| 문서 | 설명 |
|------|------|
| [제품](docs/product.md) | 서비스 개요, 사용자 스토리 |
| [아키텍처](docs/architecture.md) | 기술 스택, 시스템 구조 |
| [데이터베이스](docs/database.md) | ERD, 엔티티 설명 |
| [API](docs/api.md) | REST API 엔드포인트 |
| [로드맵](docs/roadmap.md) | Phase별 개발 계획 |
| [기여 가이드](docs/contributing.md) | PR 규칙, 커밋 컨벤션 |

## 개발 현황

- [x] **Phase 1**: Foundation (모노레포 기반 구조) ← 현재
- [ ] **Phase 2**: 인증 (회원가입/로그인/JWT)
- [ ] **Phase 3**: 핵심 기능 (일정 관리, 학부모 연결)
- [ ] **Phase 4**: 고도화 (반복 일정, 푸시 알림)

## 라이선스

Private - All rights reserved
