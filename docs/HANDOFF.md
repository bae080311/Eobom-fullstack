# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 9.8 Flywheel Log를 참고하세요.

## 최근 완료

- `feat/i18n-widgets-layer` 브랜치 — i18n 마이그레이션 3단계: `widgets` 레이어 12개 파일 전수 이관(child-detail, invite-code-list, my-info, next-session-hero, organization-dashboard, parent-tab-bar, schedule-calendar, schedule-detail[View+Skeleton], therapist-dashboard, therapist-tab-bar, week-strip).
- **패턴 1 — 기존에 엔티티 네임스페이스 `t`만 받던 Server Component**(ChildDetailView, InviteCodeListView, OrganizationDashboard)는 위젯 전용 문자열을 위해 `tWidget: Translate`(`widgets.<slice>` 네임스페이스) prop을 별도로 추가. `ScheduleDetailView`처럼 기존 `t`가 없던 곳은 단일 `t` prop으로 시작.
- **패턴 2 — 탭바/스켈레톤은 client + `useTranslations()`로 전환**: `TherapistTabBar`/`ParentTabBar`/`ScheduleDetailSkeleton`은 여러 `loading.tsx`(Suspense fallback, 동기 렌더 필요)에서 그대로 재사용되는데, 이들을 Server Component로 유지한 채 `getTranslations()`를 호출하면 async가 되어 loading.tsx의 즉시 표시 목적이 깨진다. 대신 `'use client'` + `useTranslations()` 훅으로 전환해 caller(페이지·loading.tsx) 변경 없이 해결 — Server Component였어도 이런 동기 렌더 제약이 있으면 client 전환이 우선한다.
- 이미 client component였던 `MyInfoView`/`ScheduleCalendarView`/`TherapistDashboard`는 `useTranslations()` 훅을 그대로 추가(캐러 변경 없음). `TherapistDashboard`는 요일 배열을 위젯 전용 키로 새로 만들지 않고 기존 `entities.schedule.dow`를 `useTranslations('entities.schedule').raw('dow')`로 재사용(홈페이지의 `tSchedule.raw('dow')`와 동일 패턴).
- 값(개수 등)을 조합하는 문자열(`{count}건`, `{count}명`, `{year}년 {month}`, `{name}의 {type}`)은 ICU 인터폴레이션으로 처리.
- Notion 레이어 6 §6.9 마이그레이션 범위 표를 `widgets` 완료로 갱신, 위 패턴들을 기록.
- 검증: `pnpm --filter web lint/typecheck/test/build` 전부 통과 (47 test files / 325 tests, 스펙 없는 5개 위젯은 코드 재검토로 갈음 — 이 환경엔 브라우저 자동화 도구가 없어 육안 확인은 미수행).

## 다음 작업 후보 (우선순위 순)

1. i18n 후속 이관: `app`(25개 파일) 레이어 진행 — 남은 마지막 단계. 페이지의 `metadata.title`(예: `{ title: '아동 상세' }')도 이번에 포함할지 범위 결정 필요(현재까지는 위젯 내부 렌더 문자열만 다루고 metadata는 손대지 않음).
2. WCAG AA 수정분(PR #34, 이미 병합됨) 브라우저 육안 확인 — 아직 미착수 (Docker/브라우저 도구 필요).
3. **로드맵/도메인 문서 갱신 필요**: `SessionReport`(치료 세션 AI 요약, Ollama 연동) 백엔드 API가 2026-06-26에 이미 main에 머지됐는데 Notion 도메인 모델(레이어 3)·로드맵(레이어 8) 어디에도 반영 안 됨. 웹 UI 연동도 전무. architect 레벨 결정 필요.
4. Phase 3 잔여: org 스코프 권한 전용 테스트 묶음, Playwright e2e 시나리오, API 테스트 커버리지 60% 목표 검증 — 전부 미착수.
5. Phase 5(Ops) 전체 미착수: `ci.yml` 하나만 존재, Sentry/OpenTelemetry·배포 설정(Vercel/컨테이너)·레이트리밋·joinCode 회전 감사 로그 없음.

## 참고

- 모듈별 상세 구현 이력·알려진 이슈: Claude 메모리(`project_phase2_modules` 등)
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. **주의**: Notion 로드맵(레이어 8)이 2026-05-26 기준으로 멈춰 있어 6월 이후 작업(RecurringRule 생성, SessionReport, i18n 등)을 반영하지 못함 — 다음 작업 파악은 이 문서와 Notion 레이어 6(Web 설계, 최신 유지됨)을 먼저 참고할 것.
