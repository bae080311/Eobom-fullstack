# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 9.8 Flywheel Log를 참고하세요.

## 최근 완료

- `feat/i18n-shared-entities` 브랜치 — `next-intl`(라우팅 없는 단일 `ko` 로케일) 도입, `apps/web/messages/ko.json` 신설. `shared/ui`(ConfirmDialog, FormModal)와 `entities`(schedule, invite-code, organization, notification, child) 레이어의 하드코딩된 한국어 UI 문구를 전수 이관.
- **아키텍처 발견**: Server Component가 `getTranslations()`를 직접 호출해 `async function`이 되면 RTL `render()` 테스트가 깨짐 — 번역 문자열/`t` 함수를 상위 페이지에서 **prop으로 주입**받는 패턴으로 통일 (컴포넌트는 동기 유지). 이 패턴은 `features`/`widgets`/`app` 후속 이관 시에도 그대로 따를 것.
- `SCHEDULE_STATUS_LABEL`, `formatInviteCodeStatusLabel`, `formatOrgMemberRoleLabel` 등 하드코딩 라벨 맵 제거 → 상태값을 메시지 키로 직접 조회.
- 날짜/나이 로케일 포맷팅(`date.ts`, `formatKoreanAge`)은 단순 치환이 아니라는 이유로 의도적 제외 — Notion 레이어 6에 근거 문서화.
- 테스트 인프라: `src/test/setup.ts`에 next-intl 전역 mock 추가, `src/test/createTestTranslator.ts`로 순수 함수 테스트 지원.
- Notion 레이어 6(Web 설계)에 i18n 구성·마이그레이션 범위·제외 근거 문서화.
- PR: https://github.com/bae080311/Eobom-fullstack/pull/35

## 다음 작업 후보 (우선순위 순)

1. i18n 후속 이관: `features`(28개 파일) → `widgets`(12개) → `app`(25개) 레이어 순차 진행. 위 PR의 "상위 prop 주입" 패턴을 그대로 따를 것.
2. WCAG AA 수정분(PR #34, 이미 병합됨) 브라우저 육안 확인 — 아직 미착수 (Docker/브라우저 도구 필요).
3. **로드맵/도메인 문서 갱신 필요**: `SessionReport`(치료 세션 AI 요약, Ollama 연동) 백엔드 API가 2026-06-26에 이미 main에 머지됐는데 Notion 도메인 모델(레이어 3)·로드맵(레이어 8) 어디에도 반영 안 됨. 웹 UI 연동도 전무. architect 레벨 결정 필요.
4. Phase 3 잔여: org 스코프 권한 전용 테스트 묶음, Playwright e2e 시나리오, API 테스트 커버리지 60% 목표 검증 — 전부 미착수.

## 참고

- 모듈별 상세 구현 이력·알려진 이슈: Claude 메모리(`project_phase2_modules` 등)
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. **주의**: Notion 로드맵(레이어 8)이 2026-05-26 기준으로 멈춰 있어 6월 이후 작업(RecurringRule 생성, SessionReport, i18n 등)을 반영하지 못함 — 다음 작업 파악은 이 문서와 Notion 레이어 6(Web 설계, 최신 유지됨)을 먼저 참고할 것.
