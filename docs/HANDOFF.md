# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 9.8 Flywheel Log를 참고하세요.

## 최근 완료

- `feat/i18n-features-layer` 브랜치 — i18n 마이그레이션 2단계: `features` 레이어 28개 파일(auth, create-child, create-schedule, edit-organization, edit-profile, acknowledge-schedule, issue-invite-code, manage-child, manage-organization-member, manage-schedule, revoke-invite-code, rotate-join-code, use-invite-code) 전수 이관.
- **패턴**: features 레이어는 거의 전부 client component라 `useTranslations()` 훅을 컴포넌트/훅 내부에서 직접 호출(entities/widgets Server Component와 달리 상위 prop 주입 불필요). zod 스키마 등 순수 함수는 `createXSchema(t: Translate)` 팩토리로 바꿔 컴포넌트 내부에서 `useMemo(() => createXSchema(t), [t])`로 생성.
- 컴포넌트 여러 개가 얽혀 메시지 키가 충돌하는 슬라이스(`manageChild`, `manageSchedule`)는 `features.<slice>.<fileNamespace>.<key>` 형태로 파일 단위 중첩 네임스페이스를 사용.
- `ConfirmDialog`/`FormModal`의 기본 라벨("취소"/"확인"/"저장" 등)과 값이 완전히 같은 override prop은 제거해 shared 기본값에 위임(예: `parentScheduleFooter`의 중복 `confirmLabel="확인"`).
- Notion 레이어 6 §6.9 마이그레이션 범위 표를 `features` 완료로 갱신.
- 검증: `pnpm --filter web lint/typecheck/test/build` 전부 통과 (47 test files / 325 tests).

## 다음 작업 후보 (우선순위 순)

1. i18n 후속 이관: `widgets`(12개 파일) → `app`(25개) 레이어 순차 진행. features 레이어에서 확립한 "client component는 훅 직접 호출, 파일 충돌 시 중첩 네임스페이스" 패턴은 그대로 따르되, widgets/app에는 async Server Component가 섞여 있으므로 PR #35에서 확립한 "상위 prop 주입" 패턴(엔터티 레이어 문서 §6.9 참고)도 함께 고려할 것.
2. WCAG AA 수정분(PR #34, 이미 병합됨) 브라우저 육안 확인 — 아직 미착수 (Docker/브라우저 도구 필요).
3. **로드맵/도메인 문서 갱신 필요**: `SessionReport`(치료 세션 AI 요약, Ollama 연동) 백엔드 API가 2026-06-26에 이미 main에 머지됐는데 Notion 도메인 모델(레이어 3)·로드맵(레이어 8) 어디에도 반영 안 됨. 웹 UI 연동도 전무. architect 레벨 결정 필요.
4. Phase 3 잔여: org 스코프 권한 전용 테스트 묶음, Playwright e2e 시나리오, API 테스트 커버리지 60% 목표 검증 — 전부 미착수.
5. Phase 5(Ops) 전체 미착수: `ci.yml` 하나만 존재, Sentry/OpenTelemetry·배포 설정(Vercel/컨테이너)·레이트리밋·joinCode 회전 감사 로그 없음.

## 참고

- 모듈별 상세 구현 이력·알려진 이슈: Claude 메모리(`project_phase2_modules` 등)
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. **주의**: Notion 로드맵(레이어 8)이 2026-05-26 기준으로 멈춰 있어 6월 이후 작업(RecurringRule 생성, SessionReport, i18n 등)을 반영하지 못함 — 다음 작업 파악은 이 문서와 Notion 레이어 6(Web 설계, 최신 유지됨)을 먼저 참고할 것.
