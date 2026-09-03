# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 9.8 Flywheel Log를 참고하세요.

## 최근 완료

- `feat/i18n-widgets-layer`(widgets 레이어 12개 파일, PR #37)가 이미 main에 병합되어 있었음을 확인 — 이번 세션은 `feat/i18n-app-layer` 새 브랜치에서 시작.
- i18n 마이그레이션 4단계(마지막 단계): `app` 레이어 24개 파일 전수 이관 — 공통(layout·error·not-found·providers·랜딩·`/me`), `(auth)` 로그인·회원가입, `(owner)` 기관 관리·기관 캘린더, `(parent)` 홈·알림·초대코드입력·일정[목록+상세], `(therapist)` 담당아동[목록+상세]·대시보드·발급코드·일정[목록+상세].
- **범위 결정**: `page.tsx`의 `metadata.title`도 이번에 함께 이관 — `export const metadata` 정적 리터럴을 `export async function generateMetadata()` + `getTranslations()`로 전환(레이아웃 포함). `LoginPage`/`RegisterPage`/랜딩(`page.tsx`)/`not-found.tsx`처럼 기존에 동기 컴포넌트였던 것도 이 참에 async로 전환(빌드 결과 `/login`·`/register`는 여전히 정적(`○`)으로 프리렌더됨 — 문제 없음).
- `loading.tsx`(Suspense fallback)는 widgets 단계와 동일한 이유로 `'use client'` + `useTranslations()`로 전환(`organization/calendar/loading`, `notifications/loading`, `children/loading`, `schedules/loading`).
- 여러 라우트 그룹에서 반복되는 뒤로가기·알림 aria-label은 `app.common.back.*`, `app.common.notificationsAriaLabel`로 공용화(위젯/엔티티 네임스페이스와 달리 라우트 계층은 동일 문구가 자주 반복돼 공용 키가 더 자연스러움).
- `(parent)/home/page.tsx`의 `formatWeekRangeLabel`("5월 22일" 조합)은 widgets 단계의 `shared/lib/date.ts` 제외 사례와 동일하게 의도적으로 번역 대상에서 제외(로케일별 날짜 포맷팅 로직 별도 필요).
- Notion 레이어 6 §6.9 마이그레이션 범위 표를 `app` 완료로 갱신, 상단 요약 문구도 "전체 레이어 완료"로 수정.
- 검증: `pnpm --filter web lint/typecheck/test/build` 전부 통과(47 test files / 325 tests — app 레이어는 기존에도 spec 없음, 브라우저 육안 확인은 미수행).

## 다음 작업 후보 (우선순위 순)

1. **i18n 마이그레이션 4단계 전체 완료** — 브라우저 육안 확인(다국어 전환 없이 `ko` 렌더가 기존과 동일한지)은 아직 미착수. Docker/브라우저 자동화 도구가 이 환경에 없어 코드 재검토로 갈음해왔음. 실제 두 번째 로케일 도입 여부는 별도 결정 필요.
2. WCAG AA 수정분(PR #34, 이미 병합됨) 브라우저 육안 확인 — 아직 미착수(Docker/브라우저 도구 필요).
3. **로드맵/도메인 문서 갱신 필요**: `SessionReport`(치료 세션 AI 요약, Ollama 연동) 백엔드 API가 2026-06-26에 이미 main에 머지됐는데 Notion 도메인 모델(레이어 3)·로드맵(레이어 8) 어디에도 반영 안 됨. 웹 UI 연동도 전무. architect 레벨 결정 필요.
4. Phase 3 잔여: org 스코프 권한 전용 테스트 묶음, Playwright e2e 시나리오, API 테스트 커버리지 60% 목표 검증 — 전부 미착수.
5. Phase 5(Ops) 전체 미착수: `ci.yml` 하나만 존재, Sentry/OpenTelemetry·배포 설정(Vercel/컨테이너)·레이트리밋·joinCode 회전 감사 로그 없음.

## 참고

- 모듈별 상세 구현 이력·알려진 이슈: Claude 메모리(`project_phase2_modules` 등)
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. **주의**: Notion 로드맵(레이어 8)이 2026-05-26 기준으로 멈춰 있어 6월 이후 작업(RecurringRule 생성, SessionReport, i18n 등)을 반영하지 못함 — 다음 작업 파악은 이 문서와 Notion 레이어 6(Web 설계, 최신 유지됨)을 먼저 참고할 것.
