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

- PR #43(알림에 아동·기관 맥락 추가)·PR #44(알림 문구 생성을 서버 → 웹으로 이관) main 병합. 알림 카드가 "홍길동 · 맑은소리 언어치료센터" 맥락과 `6월 1일 (월) 14:00 → 6월 2일 (화) 15:00` 형태의 변경 전후 시각을 함께 보여줍니다.

- **세션 리포트 `rawMemo`의 학부모 노출 차단**(이번 세션, PR 대기). 치료사 원본 메모가 학부모 API 응답에 그대로 내려가고 있었습니다 — 웹 카드는 렌더하지 않았지만 네트워크 응답에는 남아 있었고, "원본이 아니라 요약본을 공유한다"는 이 기능의 전제와 어긋났습니다.
  - `findOne`이 요청자 역할을 보고 PARENT면 **`rawMemo` 키 자체를 응답에서 뺍니다**. null·빈 문자열로 두면 값이 남으므로 키를 없앴습니다.
  - `generate`는 치료사 전용 경로라 그대로 내려줍니다 — 재생성 폼 프리필에 필요합니다. 그래서 `SessionReportResponseDto.rawMemo`는 optional입니다.
  - 스펙 3건 추가(API 243 → 246). 학부모 응답은 `not.toHaveProperty('rawMemo')` + 직렬화 문자열에 원본이 없는지까지 봅니다 — `undefined` 단정만으로는 키가 남은 경우를 놓칩니다.
  - **마이그레이션 없음.** 웹 변경 없음(카드가 원래 렌더하지 않았고 치료사 폼은 이미 `?? ''` 폴백).

- **`git-ship` 스킬에 슬라이스 그룹 분리 원칙 추가**(PR #47 병합). `feat/i18n-app-layer` 시절 stash에만 남아 있던 규칙을 저장소로 옮겼습니다 — 같은 레이어라도 파일이 10~15개를 넘으면 의미 있는 슬라이스 그룹 단위(3~5개 커밋)로 다시 쪼갠다는 내용입니다.

- **`git-ship` 커밋 트레일러의 모델명 하드코딩 제거**(이번 세션, PR 대기). 템플릿이 `Claude Sonnet 4.6`으로 박혀 있어 실제와 다른 모델이 저자로 기록될 수 있었습니다(저장소 이력은 전부 `Claude Opus 5 (1M context)`). `<실행 중인 모델>` 플레이스홀더로 바꾸고 이유를 명시했습니다.

- **Notion 레이어 6 §6.7의 깨진 한글 2건 수정**(이번 세션). `흙수`→`흡수`, `뜼면`→`계속 노출되면`. 아래 "미해결 항목" 2번 참고.

## 이번에 드러난 미해결 항목

1. **응답 엔벨로프가 report 모듈만 다릅니다.** `ReportService`만 레이어 5 §5.1의 `{ data: ... }`를 지키고 `schedules`·`notifications` 등은 DTO를 그대로 돌려줍니다(전역 변환 인터셉터 없음). **규약을 지키는 쪽이 소수**입니다. 현재는 `entities/session-report/api`에서 report 응답만 `.data`로 벗겨 씁니다. 어느 쪽으로 통일할지 결정 필요.
2. **Notion MCP 쓰기 경로가 한글 음절을 가끔 깨뜨립니다.** 특정 글자에 고정된 것이 아니라 **산발적**입니다 — 같은 "흡수"가 한 번은 "힙수"로 전달됐다가 다음 시도에서는 정상 전달됐습니다. 손상된 글자가 그대로 저장되므로 실제 문서가 깨집니다(레이어 6 §6.7에서 2건 확인·수정 완료).
   - **진단·검증 방법**: 페이지를 건드리지 않고 확인하려면 매칭되지 않을 문자열로 `update_content`를 호출하면 됩니다. 에러 메시지가 **서버가 실제로 받은 문자열을 그대로 되돌려주므로**, 내가 보낸 것과 비교하면 이번 요청에서 깨졌는지 알 수 있습니다. 같은 원리로 "깨진 문자열이 아직 페이지에 있는지"도 매칭 성공/실패로 판별됩니다.
   - **작업 요령**: Notion에 한글을 쓴 뒤에는 위 방법으로 검증하고, 깨지기 쉬운 글자가 나오면 다른 표현으로 우회하세요(예: "뜨면" → "표시되면"). 재시도하면 대개 통과합니다.

## 다음 작업 후보 (우선순위 순)

1. **Phase 5(Ops)** — `ci.yml`(ci·e2e)·`db-check.yml`은 갖춰졌고, `deploy-*.yml`·Sentry/OpenTelemetry·Vercel/컨테이너 배포·pg_dump 백업·레이트리밋·joinCode 회전 감사 로그가 남았습니다. 마이그레이션이 추적되고 있으니 배포 작업을 시작할 수 있습니다. **이제 로드맵에서 유일하게 열린 Phase입니다.**
2. **리포트 작성 알림 연동** — 미룬 항목. `NotificationType` enum 확장 = 마이그레이션 1건이므로 단독 PR로.
3. **기존 `ci.yml` 하드닝** — `persist-credentials`·`permissions`가 `db-check.yml`에만 적용돼 있습니다. 별도 chore.
4. **`AllExceptionsFilter`가 죽은 코드** — `apps/api/src/common/filters/`에 있지만 `main.ts`에 `useGlobalFilters`로 등록되지 않아 실제 응답은 NestJS 기본 형식입니다. 레이어 5 §5.1 에러 엔벨로프와도 불일치. 등록할지/문서를 실제에 맞출지 결정 필요. (위 "미해결 항목" 1번과 함께 "응답 형식 정리" PR로 묶는 것도 방법)
5. i18n·WCAG AA 브라우저 육안 확인. 두 번째 로케일 도입 여부는 여전히 미결정.

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
