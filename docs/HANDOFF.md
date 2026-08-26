# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 9.8 Flywheel Log를 참고하세요.

## 최근 완료

- `feat/owner-org-calendar` 브랜치 — 기관 전체 캘린더 UI(OWNER) 구현: `(owner)/organization/calendar` 라우트 추가. 백엔드 `GET /schedules`가 OWNER 멤버십을 감지하면 자동으로 기관 전체 일정을 반환하고 있어(`schedules.service.ts`의 `findAllForOwner`) 별도 API 작업 없이 기존 `ScheduleCalendarView` 위젯·`fetchSchedules`만 재사용해 프론트엔드만으로 구현.
- 같은 브랜치에서 `ScheduleCard`에 `therapistName` 조건부 표시 추가 — 여러 치료사의 일정이 섞이는 기관 전체 뷰에서 구분 가능하도록 함(치료사 본인 뷰는 `therapistName`이 없어 기존과 동일). Notion 6.6 "일정 카드에 항상 치료사명 노출" 원칙이 있었지만 실제로는 미구현 상태였던 기존 공백을 메움.
- 부수 리팩터: `(therapist)/schedules/page.tsx`에만 있던 "이번 달 KST 범위" 계산 로직을 `shared/lib/date.ts`의 `getCurrentKSTMonthRange`로 추출(두 번째 사용처 등장 시점에 중복 제거).
- 개발 DB에 임시 테스트 데이터(2번째 치료사·아동·일정 2건)를 넣어 Playwright로 브라우저 검증 후 정리 완료 — OWNER 계정으로 `/organization` → 캘린더 아이콘 → `/organization/calendar` 진입, 여러 치료사 일정이 치료사명과 함께 표시됨을 확인. 비-OWNER 치료사 `/schedules`는 회귀 없음(치료사명 접미사 안 붙음) 확인.
- Notion 레이어 6(Web 설계) 갱신: "기관 전체 캘린더"를 v0.2 예정(미구현) 목록에서 제거하고 라우트 설계·로딩 표준 목록에 반영.

## 다음 작업 후보 (우선순위 순)

1. **아동 `primaryTherapist` 재지정 UI** — 백엔드는 완료(2026-07-19), 웹 미구현. `entities/organization`의 멤버 목록 fetch(`fetchOrganizationMembers`)를 재사용해 담당 치료사 선택 드롭다운을 만들면 됨.
2. **역할별 라우팅 개선** — 미들웨어의 수동 JWT 디코딩(`decodeRole`/`isTokenExpired`)과 `(owner)/layout.tsx`의 API 기반 멤버십 가드가 서로 다른 층에 분리되어 있음. JWT 파싱을 유틸화하고 두 가드 메커니즘을 통합하는 리팩터링 필요(Notion 레이어 6 v0.2 예정 참고).
3. `/redeem`(학부모 초대코드 입력), 치료사 `invite-codes`(발급 코드 목록) 페이지 — 착수 전.
4. WCAG AA 검토, 한국어 i18n 분리 — 착수 전.

## 참고

- `.claude/skills/git-ship/SKILL.md`·`CLAUDE.md`에 핸드오프 문서화 규칙(이 문서를 만든 규칙 자체)을 추가한 변경이 여전히 커밋되지 않은 채 워킹 트리에 남아 있음(2세션째) — 이번 PR과도 무관한 별도 관심사라 포함하지 않았음. 다음 세션에서 별도 커밋 여부를 반드시 확인할 것.
- 모듈별 상세 구현 이력·알려진 이슈: Claude 메모리(`project_phase2_modules` 등)
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. **주의**: Notion 로드맵(레이어 8)이 2026-05-26 기준으로 멈춰 있어 6월 이후 작업을 반영하지 못함 — 다음 작업 파악은 이 문서와 Notion 레이어 6(Web 설계, 최신 유지됨)을 먼저 참고할 것.
