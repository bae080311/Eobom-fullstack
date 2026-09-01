# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 9.8 Flywheel Log를 참고하세요.

## 최근 완료

- `refactor/role-routing-guard` 브랜치 — 역할별 라우팅 가드 통합. `middleware.ts`의 수동 base64 JWT 디코딩(`decodeRole`/`isTokenExpired`)을 `shared/lib/jwt.ts`(`parseJwt`/`getJwtRole`/`isJwtExpired`) 공통 유틸로 통합하고, `(owner)/layout.tsx`의 인라인 `OrganizationMembership` 가드 로직을 `entities/organization/model/guardOrgRole.ts`의 `requireOrgRole(role, fallbackPath)`로 추출 — 향후 `STAFF` 등 신규 org-role 라우트 그룹도 동일 헬퍼를 재사용 가능.
- 동일 안티패턴(수동 base64 디코딩)을 중복하던 미사용 `features/auth/ui/AuthGuard.tsx` 삭제(전체 grep으로 미사용 확인 후 제거).
- Notion 레이어 6(Web 설계) 갱신 — "역할별 라우팅 개선"을 v0.2 예정 목록에서 제거, 경로 그룹/레이아웃 섹션을 새 가드 구조로 갱신.
- PR: https://github.com/bae080311/Eobom-fullstack/pull/31

## 다음 작업 후보 (우선순위 순)

1. `/redeem`(학부모 초대코드 입력), 치료사 `invite-codes`(발급 코드 목록) 페이지 — 백엔드 API(`POST /invite-codes/parent-link`, `GET /invite-codes`, `DELETE /invite-codes/:id`, `POST /invite-codes/redeem`)는 이미 구현 완료, Web 슬라이스(`entities/invite-code` 등)부터 신규 구현 필요. 착수 전.
2. WCAG AA 검토, 한국어 i18n 분리 — 착수 전.

## 참고

- 모듈별 상세 구현 이력·알려진 이슈: Claude 메모리(`project_phase2_modules` 등)
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. **주의**: Notion 로드맵(레이어 8)이 2026-05-26 기준으로 멈춰 있어 6월 이후 작업을 반영하지 못함 — 다음 작업 파악은 이 문서와 Notion 레이어 6(Web 설계, 최신 유지됨)을 먼저 참고할 것.
