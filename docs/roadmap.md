# 로드맵

## Phase 1: Foundation (현재)

**목표**: 풀스택 모노레포 기반 구조 구축

- [x] pnpm workspace + Turborepo 모노레포
- [x] NestJS API 스캐폴딩 (모듈 스텁)
- [x] Next.js PWA 스캐폴딩
- [x] packages/shared (공통 타입/DTO/열거형)
- [x] packages/config (공통 설정)
- [x] Prisma 도메인 스키마 초안
- [x] Docker Compose (PostgreSQL)
- [x] GitHub Actions CI
- [x] PR/Issue 템플릿
- [x] 프로젝트 문서 초안

---

## Phase 2: 인증 (Auth)

**목표**: 치료사와 학부모 회원가입/로그인

- [ ] bcrypt 비밀번호 해싱
- [ ] JWT 발급/검증 (`@nestjs/jwt`)
- [ ] JwtAuthGuard 구현
- [ ] RolesGuard 구현 (`@Roles()` 데코레이터)
- [ ] `POST /auth/register` 구현
- [ ] `POST /auth/login` 구현
- [ ] `GET /users/me` 구현
- [ ] Next.js 로그인/회원가입 폼 구현
- [ ] 클라이언트 토큰 저장 (메모리 또는 httpOnly 쿠키)
- [ ] Swagger 활성화

**예상 기간**: 1주

---

## Phase 3: 핵심 기능

**목표**: 치료사-학부모 연결 및 일정 관리

- [ ] 아동 등록/수정/삭제 (`ChildrenModule`)
- [ ] 초대 코드 생성/사용 (`InviteCodesModule`)
- [ ] 치료사 일정 등록/수정/취소 (`SchedulesModule`)
- [ ] 학부모 일정 조회 (`SchedulesModule`)
- [ ] 일정 변경 시 알림 생성 (`NotificationsModule`)
- [ ] 학부모 알림 확인 처리
- [ ] Next.js 치료사 대시보드 구현
- [ ] Next.js 학부모 일정 조회 화면 구현
- [ ] TanStack Query 도입

**예상 기간**: 2-3주

---

## Phase 4: 고도화

**목표**: 반복 일정, 알림, 사용성 개선

- [ ] 반복 일정 생성 (주간/격주)
- [ ] 웹 푸시 알림 (Web Push API)
- [ ] 치료 기록 메모
- [ ] 캘린더 뷰 UI
- [ ] 오프라인 지원 강화 (PWA Service Worker)
- [ ] 배포 인프라 구성

**예상 기간**: 3-4주
