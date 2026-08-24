# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 9.8 Flywheel Log를 참고하세요.

## 최근 완료

- `feat/owner-org-dashboard` 브랜치 — OWNER 기관 관리 웹 대시보드 1차 구현: `(owner)/organization` 라우트(OWNER 멤버십 서버 가드) + 기관 이름 수정·참여 코드 재발급·멤버 역할변경/탈퇴 기능, `/me` 페이지에 조건부 진입 링크(`isOwner`) 추가. 백엔드 `organizations` API는 이미 구현되어 있어 프론트엔드만 추가.
- 같은 브랜치에서 PR 리뷰로 발견된 버그 수정: `schedules.service.ts`의 `update`/`cancel`/`confirm`이 `findOne`과 달리 OWNER 우회 없이 항상 403을 던지던 것을 공통 헬퍼(`assertCanAccessSchedule`)로 통일해 해결. `findAll`의 중복 프로필 조회도 함께 정리.

## 다음 작업 후보 (우선순위 순)

1. **기관 전체 캘린더 UI** — `(owner)` 대시보드에 통합 예정(Notion 로드맵 Phase 4). 백엔드 `GET /schedules?organizationId=...`(OWNER 분기)는 이미 완료.
2. **아동 `primaryTherapist` 재지정 UI** — 백엔드는 완료(2026-07-19), 웹 미구현. `entities/organization`의 멤버 목록 fetch(`fetchOrganizationMembers`)를 재사용해 담당 치료사 선택 드롭다운을 만들면 됨.
3. WCAG AA 검토, 한국어 i18n 분리 — 착수 전.

## 참고

- `.claude/skills/git-ship/SKILL.md`·`CLAUDE.md`에 핸드오프 문서화 규칙(이 문서를 만든 규칙 자체)을 추가한 변경이 아직 커밋되지 않은 채 워킹 트리에 남아 있음 — 이번 PR과는 무관한 별도 관심사라 포함하지 않았음. 다음 세션에서 별도 커밋 여부 확인 필요.
- 모듈별 상세 구현 이력·알려진 이슈: Claude 메모리(`project_phase2_modules` 등)
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. **주의**: Notion 로드맵(레이어 8)이 2026-05-26 기준으로 멈춰 있어 6~8월 작업을 반영하지 못함 — 다음 작업 파악은 이 문서를 먼저 참고할 것.
