# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 9.8 Flywheel Log를 참고하세요.

## 최근 완료

- PR #39(권한·org 스코프 전용 테스트 묶음) main 병합 완료.
- **Phase 3 전항목 완료** — 마지막 잔여였던 Playwright e2e를 `test/e2e-playwright` 브랜치에서 구축했습니다. Notion 레이어 8 §8.1·§8.4를 "완료"로, 레이어 5 §5.12를 실제 구성으로 갱신했습니다.
  - 시나리오 4건 전부 통과: 🅰️ 기관 셋업(정상 + 잘못된 참여 코드 차단), 🅱️ 일정 공유(아동 등록 → 초대코드 → 학부모 가입·연결 → 일정 생성 → 알림 → 조회 → ACK, + 미연결 학부모 차단)
  - 실행: `pnpm e2e:db:up` → `pnpm e2e:db:migrate` → `pnpm test:e2e`. CI는 `ci.yml`의 `e2e` job.
  - 테스트 DB는 `docker-compose.test.yml`(포트 **5434**, tmpfs). 5433은 다른 컨테이너가 점유하는 경우가 있어 피했습니다.
- **e2e를 만들면서 프로덕션 버그 2건을 발견해 함께 고쳤습니다.**
  1. `apps/web/src/lib/api.ts` — ky 2.x는 `error.data`를 채우며 응답 본문을 소비하므로 `err.response.json()`이 항상 실패했고, 그 결과 **모든 API 에러가 "요청에 실패했습니다." fallback으로만 표시**되고 있었습니다. `err.data`를 쓰도록 수정. `api.spec.ts`가 `response.json()`으로 본문을 주도록 모킹해 이 버그를 통과시키고 있었으므로 스펙도 ky 2 계약대로 고쳤습니다.
  2. `apps/api/src/modules/auth/email.service.ts` — `secure: true` 하드코딩으로 465 외 포트 접속이 불가했습니다. nodemailer 관례대로 `port === 465`에서만 즉시 TLS를 쓰게 바꿔 로컬 SMTP 캐처(mailpit:1025)를 붙일 수 있게 했습니다.
- **PR #40 리뷰(CodeRabbit) 2건 반영** — 둘 다 유효했고 한 건은 위 2번 수정이 만든 회귀였습니다.
  1. `ConfigService`는 환경변수를 문자열로 돌려주므로 `SMTP_PORT=465`가 `'465'`로 들어와 `port === 465`가 false였습니다. **운영에서 465를 쓰면 implicit TLS가 꺼진 채 접속**하게 되는 문제로, 숫자 정규화 + 유효 범위 검증 + 465 폴백을 추가했습니다. e2e는 1025를 쓰기 때문에 이 문제를 잡지 못했습니다.
  2. `reuseExistingServer`가 켜져 있으면 이미 떠 있던 프로세스가 `serverEnv`를 받지 못해, 앱은 개발 DB(5432)를 향한 채 `resetDb`는 테스트 DB(5434)를 비우는 불일치가 생깁니다. 양쪽 `webServer` 모두 `false`로 고정했습니다.
- 검증: `pnpm lint`·`typecheck`·`build`·`test`(api 237 + web 325 = 562건) + `pnpm test:e2e`(4건) 전부 통과.

## 다음 작업 후보 (우선순위 순)

1. **기관명이 학부모 화면에 전혀 노출되지 않는 문제** — 레이어 1 §1.4 6단계는 일정 조회 시 "기관명·치료사명 함께 표기"를 요구하고 §5.9 Notification 샘플에도 `organizationName`이 있지만, `widgets/schedule-detail`은 치료사명·시간·종류·메모만 렌더하고 web 코드 어디에도 `organizationName` 사용처가 없습니다. e2e에서는 해당 단정을 보류하고 주석으로 남겼습니다(Notion 8.4에 기록). **학부모 신뢰도에 직결되는 항목**이라 노출 위치 결정이 필요합니다(architect 판단 권장).
2. **Phase 4.5 SessionReport 웹 UI 연동** — 백엔드(`POST/GET /schedules/:scheduleId/report*`, Ollama)는 완료됐으나 `features`/`widgets`에 대응 슬라이스가 전무합니다. 치료사 작성 화면·학부모 열람 화면·알림 연동 여부 범위 결정부터 필요(Notion 8.7 Decision Log 리스크 항목 참고).
3. **Phase 5(Ops) 전체 미착수** — `ci.yml`에 이제 `ci`·`e2e` 두 job이 있지만, Sentry/OpenTelemetry·배포 설정(Vercel/컨테이너)·pg_dump 백업·레이트리밋·joinCode 회전 감사 로그는 모두 없습니다.
4. **`AllExceptionsFilter`가 죽은 코드** — `apps/api/src/common/filters/`에 정의돼 있지만 `main.ts`에 `useGlobalFilters`로 등록되지 않아 실제 응답은 NestJS 기본 형식입니다. 레이어 5 §5.1이 정의한 에러 엔벨로프(`{statusCode, code, message, details?}`)와도 불일치합니다. 등록할지/문서를 실제에 맞출지 결정 필요.
5. **`.claude/skills/git-ship/SKILL.md` 미커밋 변경** — `git stash list`의 `stash@{0}`에 커밋 분리 원칙 추가분이 보존돼 있습니다(메모리 `feedback_commit_splitting`과 동일 내용). 별도 chore 커밋으로 정리할지 확인 필요.
6. i18n·WCAG AA 브라우저 육안 확인 — 이제 Playwright가 있으므로 시각 회귀나 접근성 스냅샷을 e2e에 얹는 방식도 검토 가능합니다. 두 번째 로케일 도입 여부는 여전히 미결정.

## 참고

- **e2e 실행 전 `pnpm dev`를 내려야 합니다.** `reuseExistingServer: false`라서 3000·3001이 점유돼 있으면 Playwright가 즉시 에러를 냅니다(개발 DB와 테스트 DB가 섞이는 것을 막기 위한 의도된 동작).
- e2e 작성 시 주의: 폼의 `<label>`이 `htmlFor`로 input과 연결돼 있지 않아 `getByLabel`이 동작하지 않습니다. placeholder·role 기준으로 잡았고 `data-testid`는 도입하지 않았습니다.
- **환경변수를 숫자·불리언으로 쓸 때는 직접 변환해야 합니다.** `ConfigModule.forRoot({ isGlobal: true })`는 타입 변환을 하지 않아 `config.get<number>('X')`가 문자열을 돌려줍니다(제네릭은 TS 단계의 주장일 뿐). 위 SMTP_PORT 사례가 여기서 나왔습니다.
- 회원가입 e2e는 이메일 인증을 반드시 통과해야 합니다(`sendVerificationCode` 성공 시에만 다음 단계로 이동). mailpit으로 발송을 받고, 코드는 메일 본문 대신 DB의 `EmailVerificationRequest.code`를 읽어 입력합니다.
- 모듈별 상세 구현 이력·알려진 이슈: Claude 메모리(`project_phase2_modules` 등)
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. 로드맵(레이어 8)·API 설계(레이어 5)는 이번 세션에 최신화됐습니다.
