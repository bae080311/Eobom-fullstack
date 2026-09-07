# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 9.8 Flywheel Log를 참고하세요.

## 최근 완료

- **Phase 4.5 SessionReport 웹 UI 연동**(이번 세션, PR 대기) → **Phase 4.5 완료**. 백엔드는 2026-06-26에 병합됐는데 웹에 report 슬라이스가 전혀 없어(`apps/web` 전체에 사용처 0건) 이 기능을 쓸 방법 자체가 없었습니다.
  - `entities/session-report` — 조회·생성 API, tone 해석·색상, `useSessionReport` 쿼리, `SessionReportCard`·`SessionReportSection`.
  - `features/generate-session-report` — `useGenerateSessionReport` 뮤테이션, `TherapistSessionReportSection`, `GenerateSessionReportForm`.
  - `ScheduleDetailView`에 **`extra?: ReactNode` 슬롯 추가** — 메모 아래·하단 액션바 위에 역할별 섹션을 끼웁니다. optional이라 기존 호출부는 무변경입니다.
  - 치료사(`/schedules/[id]`)는 작성·재생성, 학부모(`/schedule/[id]`)는 열람 전용. **학부모 화면은 리포트가 없으면 섹션을 아예 안 띄웁니다** — 예정된 미래 일정마다 "아직 없어요"가 뜨면 소음입니다.
  - **재생성은 upsert라 기존 리포트를 덮어씁니다** → `ConfirmDialog` 경유. 폼에는 기존 `rawMemo`를 채워 처음부터 다시 쓰지 않게 했습니다.
  - **생성은 최대 30초** 걸립니다(`OllamaService`의 `AbortSignal.timeout(30000)`). 제출 버튼이 "정리하는 중... (최대 30초)"로 바뀌고, 생성 중에는 모달을 닫지 못하게 막습니다(요청은 계속 진행돼 결과를 놓칩니다). 503은 Ollama 미기동이므로 재시도 안내 문구로 바꿔 보여줍니다.
  - `tone`은 DB에 string으로 저장되는 LLM 생성값이라 계약을 벗어날 수 있어 `resolveSessionReportTone`이 모르는 값을 `neutral`로 흡수합니다.
  - 메모 길이 제약은 `packages/shared`에 `REPORT_MEMO_MIN_LENGTH`/`REPORT_MEMO_MAX_LENGTH`로 노출해 API·웹 폼이 같은 값을 씁니다(문구만 i18n).
  - **알림 연동은 의도적으로 제외**했습니다 — `NotificationType`에 값을 추가해야 하고 이는 DB enum 마이그레이션을 동반하므로, 규칙 04("1 PR = 1 마이그레이션")에 따라 분리했습니다. **마이그레이션 없음.**
  - 테스트 25건 추가(web 336 → 361). Notion 레이어 5 §5.10(신규)·레이어 6 §6.7(신규)·레이어 8 §8.5 + Decision Log 갱신, 규칙 01·CLAUDE.md 용어 사전에 `SessionReport` 추가.
- 검증: `pnpm lint`·`typecheck`(e2e 포함)·`build`·`test`(API 243 + web 361) 전부 통과.

## 이번에 드러난 미해결 항목

1. **`rawMemo`가 학부모 응답에도 내려갑니다.** 웹 카드는 렌더하지 않지만 네트워크 응답에는 그대로 있습니다. 치료사 원본 메모 대신 요약본을 공유한다는 이 기능의 전제와 어긋나므로 **역할별 응답 분리가 필요**합니다(레이어 5 §5.10 간극 ②). 웹만으로는 막을 수 없어 백엔드 작업입니다.
2. **응답 엔벨로프가 report 모듈만 다릅니다.** `ReportService`만 레이어 5 §5.1의 `{ data: ... }`를 지키고 `schedules`·`notifications` 등은 DTO를 그대로 돌려줍니다(전역 변환 인터셉터 없음). **규약을 지키는 쪽이 소수**입니다. 현재는 `entities/session-report/api`에서 report 응답만 `.data`로 벗겨 씁니다. 어느 쪽으로 통일할지 결정 필요.
3. **Notion MCP 경로가 일부 한글 음절을 깨뜨립니다.** 이번 세션에 쓴 "흡수"가 "흙수"로, "뜨면"이 "뜼면"으로 저장됐습니다(기존 문서의 "스햤마"·"자장소"·"귀칙"도 같은 원인으로 보입니다). **Notion 문서를 쓴 뒤에는 눈으로 확인**하세요.

## 다음 작업 후보 (우선순위 순)

1. **Phase 5(Ops)** — `ci.yml`(ci·e2e)·`db-check.yml`은 갖춰졌고, `deploy-*.yml`·Sentry/OpenTelemetry·Vercel/컨테이너 배포·pg_dump 백업·레이트리밋·joinCode 회전 감사 로그가 남았습니다. 마이그레이션이 추적되고 있으니 배포 작업을 시작할 수 있습니다. **이제 로드맵에서 유일하게 열린 Phase입니다.**
2. **위 "미해결 항목" 1번(`rawMemo` 노출)** — 개인정보 성격이라 우선순위를 올릴 만합니다. `SessionReportResponseDto`를 역할별로 나누거나 `findOne`에서 PARENT일 때 필드를 빼는 방식.
3. **리포트 작성 알림 연동** — 이번에 미룬 항목. `NotificationType` enum 확장 = 마이그레이션 1건이므로 단독 PR로.
4. **기존 `ci.yml` 하드닝** — `persist-credentials`·`permissions`가 `db-check.yml`에만 적용돼 있습니다. 별도 chore.
5. **`AllExceptionsFilter`가 죽은 코드** — `apps/api/src/common/filters/`에 있지만 `main.ts`에 `useGlobalFilters`로 등록되지 않아 실제 응답은 NestJS 기본 형식입니다. 레이어 5 §5.1 에러 엔벨로프와도 불일치. 등록할지/문서를 실제에 맞출지 결정 필요. (2번 항목과 함께 "응답 형식 정리" PR로 묶는 것도 방법)
6. **`.claude/skills/git-ship/SKILL.md` 미커밋 변경** — `git stash list`의 `stash@{0}`에 커밋 분리 원칙 추가분이 보존돼 있습니다.
7. i18n·WCAG AA 브라우저 육안 확인. 두 번째 로케일 도입 여부는 여전히 미결정.

## 참고

- **세션 리포트를 로컬에서 보려면 Ollama가 떠 있어야 합니다.** `OLLAMA_URL`(기본 `http://localhost:11434`)·`OLLAMA_MODEL`(기본 `qwen2.5:7b`). 안 떠 있으면 503이 나고 웹은 재시도 안내를 띄웁니다 — 화면 자체는 정상 동작합니다.
- 리포트 e2e는 없습니다(로컬 Ollama 의존). 단위 테스트로만 덮여 있습니다.
- **스키마를 바꾸면 반드시 `prisma migrate dev`로 마이그레이션 파일을 남겨야 합니다.** `db-check.yml`이 `schema.prisma`와의 불일치를 CI에서 잡습니다(`prisma/**` 변경 시에만 트리거).
- **e2e 실행 전 `pnpm dev`를 내려야 합니다.** `reuseExistingServer: false`라서 3000·3001이 점유돼 있으면 Playwright가 즉시 에러를 냅니다(개발 DB와 테스트 DB가 섞이는 것을 막기 위한 의도된 동작).
- e2e 실행: `pnpm e2e:db:up` → `pnpm e2e:db:push` → `pnpm test:e2e`. 테스트 DB는 5434(tmpfs), mailpit은 1025.
- e2e 작성 시 주의: 폼의 `<label>`이 `htmlFor`로 input과 연결돼 있지 않아 `getByLabel`이 동작하지 않습니다. placeholder·role 기준으로 잡았고 `data-testid`는 도입하지 않았습니다. `getByText`는 부분일치라 상수값이 다른 문자열(예: 기관명)에 포함되지 않도록 주의해야 합니다.
- **환경변수를 숫자·불리언으로 쓸 때는 직접 변환해야 합니다.** `ConfigModule.forRoot({ isGlobal: true })`는 타입 변환을 하지 않아 `config.get<number>('X')`가 문자열을 돌려줍니다(제네릭은 TS 단계의 주장일 뿐).
- 모듈별 상세 구현 이력·알려진 이슈: Claude 메모리(`project_phase2_modules` 등)
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. 로드맵(레이어 8)·API 설계(레이어 5)·Web 설계(레이어 6)는 최신 상태입니다.
