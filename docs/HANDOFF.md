# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 9.8 Flywheel Log를 참고하세요.

## 최근 완료

- **알림 문구 생성을 서버 → 웹으로 이관**(이번 세션, PR 대기 / `feat/notification-context` 위에 스택). API가 `"김치료 치료사님이 새 일정을 등록했습니다"` 같은 한국어 문장을 만들어 저장하고 있어 클라이언트가 번역할 수 없었습니다 — Phase 4에서 UI 문자열을 전부 카탈로그로 뺀 것과 모순이었습니다.
  - `payload`에 원자 데이터만: `startAt`, 시간이 바뀌면 `prevStartAt`, 반복 일괄 생성이면 `scheduleCount`. 문구는 웹이 `entities.notification.sub.*`로 조립합니다.
  - **문구 자체가 유용해졌습니다** — 이전엔 "치료사님이 일정을 변경했습니다"라 언제로 바뀌었는지 알 수 없었는데, 이제 `6월 1일 (월) 14:00 → 6월 2일 (화) 15:00`으로 보입니다.
  - 구조화 이전 알림은 `payload.message`로 폴백(deprecated, 신규 저장 안 함) — **백필·마이그레이션 없음**.

- **알림에 "어느 아이·어느 센터" 맥락 추가**(이번 세션, PR 대기). 알림 메시지는 치료사명만 담고 있어 아이가 둘 이상인 학부모는 어느 아이 알림인지 구분할 수 없었습니다(레이어 5 §5.9 불일치).
  - `NotificationResponseDto`에 `organizationName`·`therapistName`·`childName` 추가. **저장하지 않고 조회 시점에 조인**해 채우므로 과거 알림도 함께 채워지고 이름이 바뀌어도 최신값이 나옵니다. `Notification`에 이미 관계가 있어 **마이그레이션 없음**.
  - 알림 카드에 "홍길동 · 맑은소리 언어치료센터" 줄 추가(연결 정보 없으면 렌더 안 함).
  - `findAll`·`markAsRead`는 그동안 테스트가 전혀 없었습니다(커버리지 45%) — 권한 검증 포함해 스펙 신규 작성(API 237 → 243건).
  - 소비처 없는 `MOCK_NOTIFICATIONS` 제거(알림 화면이 실제 API로 바뀐 뒤 죽은 코드).

- PR #40(Playwright e2e 도입) main 병합 → **Phase 3 전항목 완료**. e2e 4건 + 단위 562건이 CI에서 돌고 있습니다.
- **`prisma/migrations`를 버전 관리에 포함**(이번 세션). `.gitignore`가 배제하고 있어 저장소에 마이그레이션이 없었고, 그래서 새 환경에서 `migrate deploy`로 스키마를 재현할 수 없었습니다 — Phase 5 배포를 막는 선행 조건이자 규칙 04("1 PR = 1 마이그레이션 — 롤백 식별성 확보") 위반이었습니다.
  - 기존 3개가 현재 `schema.prisma`와 **정확히 일치**함을 먼저 확인해서(`migrate diff` → "No difference detected") 재작성 없이 그대로 커밋했습니다. 28K 순수 DDL, 민감 정보 없음.
  - 빈 DB에 `migrate deploy` → 15개 테이블 생성, `migrate status` "up to date" 확인.
  - **`db-check.yml` 추가** — `migrate diff --exit-code`로 마이그레이션과 스키마가 어긋나면 CI 실패. 일부러 드리프트를 주입해 `exit 2` + 어긋난 컬럼 출력을 확인했습니다. 로드맵 §8.6의 `db-check.yml` 자리입니다.
  - e2e 테스트 DB는 계속 `db push`를 씁니다(일회용 DB라 이력 불필요). 마이그레이션 무결성은 `db-check.yml`이 전담합니다.
  - Notion 8.7 Decision Log에 전환 기록, §8.4 미해결 간극에서 이 항목을 해소 처리했습니다.
  - PR #41 리뷰 반영: `db-check.yml`에 `persist-credentials: false`·`permissions: contents: read` 적용. 마이그레이션 SQL에 backfill을 넣으라는 지적은 **반영하지 않았습니다** — 이미 2026-05-27에 적용된 마이그레이션이라 SQL을 고치면 Prisma 체크섬 검증이 깨집니다(과거 마이그레이션은 새 forward 마이그레이션으로 고치는 것이 원칙).
- 검증: `pnpm lint`·`typecheck`(e2e 포함)·`build`·`test`(562건)·`test:e2e`(4건) 전부 통과.

## 다음 작업 후보 (우선순위 순)

1. **Phase 4.5 SessionReport 웹 UI 연동** — 백엔드(`POST/GET /schedules/:scheduleId/report*`, Ollama)는 완료됐으나 `features`·`widgets`·`entities` 어디에도 report 슬라이스가 없습니다(직접 확인). 치료사 작성 화면·학부모 열람 화면·알림 연동 여부 범위 결정부터 필요(Notion 8.7 Decision Log 리스크 항목 참고).
2. **Phase 5(Ops) 나머지** — `ci.yml`(ci·e2e)·`db-check.yml`은 갖춰졌고, `deploy-*.yml`·Sentry/OpenTelemetry·Vercel/컨테이너 배포·pg_dump 백업·레이트리밋·joinCode 회전 감사 로그가 남았습니다. 마이그레이션이 추적되기 시작했으니 배포 작업을 시작할 수 있습니다.
3. **기존 `ci.yml`도 `persist-credentials`·`permissions` 하드닝이 안 돼 있습니다.** `db-check.yml`에만 적용했고 PR #41 diff 밖이라 건드리지 않았습니다. 별도 chore로 정리할지 판단 필요.
4. **`AllExceptionsFilter`가 죽은 코드** — `apps/api/src/common/filters/`에 정의돼 있지만 `main.ts`에 `useGlobalFilters`로 등록되지 않아 실제 응답은 NestJS 기본 형식입니다. 레이어 5 §5.1이 정의한 에러 엔벨로프(`{statusCode, code, message, details?}`)와도 불일치합니다. 등록할지/문서를 실제에 맞출지 결정 필요.
5. **`.claude/skills/git-ship/SKILL.md` 미커밋 변경** — `git stash list`의 `stash@{0}`에 커밋 분리 원칙 추가분이 보존돼 있습니다(메모리 `feedback_commit_splitting`과 동일 내용). 별도 chore 커밋으로 정리할지 확인 필요.
6. i18n·WCAG AA 브라우저 육안 확인 — 이제 Playwright가 있으므로 시각 회귀나 접근성 스냅샷을 e2e에 얹는 방식도 검토 가능합니다. 두 번째 로케일 도입 여부는 여전히 미결정.

## 참고

- **스키마를 바꾸면 반드시 `prisma migrate dev`로 마이그레이션 파일을 남겨야 합니다.** 이제 `db-check.yml`이 `schema.prisma`와 마이그레이션의 불일치를 CI에서 잡습니다(`prisma/**` 변경 시에만 트리거).
- **e2e 실행 전 `pnpm dev`를 내려야 합니다.** `reuseExistingServer: false`라서 3000·3001이 점유돼 있으면 Playwright가 즉시 에러를 냅니다(개발 DB와 테스트 DB가 섞이는 것을 막기 위한 의도된 동작).
- e2e 실행: `pnpm e2e:db:up` → `pnpm e2e:db:push` → `pnpm test:e2e`. 테스트 DB는 5434(tmpfs), mailpit은 1025.
- e2e 작성 시 주의: 폼의 `<label>`이 `htmlFor`로 input과 연결돼 있지 않아 `getByLabel`이 동작하지 않습니다. placeholder·role 기준으로 잡았고 `data-testid`는 도입하지 않았습니다. `getByText`는 부분일치라 상수값이 다른 문자열(예: 기관명)에 포함되지 않도록 주의해야 합니다.
- **환경변수를 숫자·불리언으로 쓸 때는 직접 변환해야 합니다.** `ConfigModule.forRoot({ isGlobal: true })`는 타입 변환을 하지 않아 `config.get<number>('X')`가 문자열을 돌려줍니다(제네릭은 TS 단계의 주장일 뿐).
- 모듈별 상세 구현 이력·알려진 이슈: Claude 메모리(`project_phase2_modules` 등)
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. 로드맵(레이어 8)·API 설계(레이어 5)는 최신 상태입니다.
