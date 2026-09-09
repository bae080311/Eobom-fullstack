# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 8.7 Decision Log를 참고하세요.

## ⚠️ 먼저 볼 것 — 열린 PR 1개

`#49`~`#55` 중 **응답 엔벨로프 통일(`#55`)이 main에 도달하지 못했습니다.** 스택 PR의 머지 레이스가 두 번 반복된 결과입니다 — `#54`가 main으로 머지되는 시점에 `#55`는 아직 그 브랜치에 없었습니다.

**[#56](https://github.com/bae080311/Eobom-fullstack/pulls) (`fix/land-response-envelope`)이 남은 전부를 main으로 가져갑니다.** base가 `main`이라 이번엔 레이스가 없습니다.

> **교훈: PR의 base는 항상 main으로 두세요.** 스택 PR은 (1) 머지 순서가 엇갈리면 상위 내용이 main에 누락되고 (2) CodeRabbit이 base가 기본 브랜치가 아니면 리뷰를 아예 건너뜁니다. 이번 세션에 두 문제가 모두 실제로 터졌습니다.

## 최근 완료

**Phase 5(Ops) 전항목 + Phase 4.5 후속 항목** — 로드맵(Notion 레이어 8)에 열린 Phase가 없습니다.

레이트 리밋 · `/api/health` · API Dockerfile · `deploy-api`/`deploy-web`/`backup-staging` 워크플로 · Sentry(API+Web) · joinCode 회전 감사 로그 · 세션 리포트 알림 · 응답 엔벨로프 통일.

### 작업 중 드러난 것 — 전부 "문서엔 있는데 실제론 없던" 것들

1. **`/api/health`가 아예 없었습니다.** Phase 1 DoD에 `[x]`인데 404였습니다.
2. **`.env.example`이 한 번도 커밋된 적이 없었습니다.** `.gitignore`가 `.env*` 목록에 섞어 무시하고 있어 `cp .env.example .env`가 새 클론에서 실패했습니다. 로컬 파일은 다른 프로젝트 템플릿 잔재였습니다.
3. **Docker 이미지가 조용히 깨졌습니다.** `.dockerignore`의 `*.tsbuildinfo`가 루트만 매칭 → `tsc --build`가 빌드를 건너뜀 → nest CLI가 `@eobom/shared`를 `.ts` 경로로 재작성 → **빌드는 성공하고 런타임에만 터짐.** 이제 Dockerfile이 빌드 단계에서 검사해 실패시킵니다.
4. **백업 스크립트가 성공해도 항상 `exit 1`이었습니다.** `$RETENTION_DAYS일보다...`에서 bash가 한글 '일'의 첫 바이트를 변수명에 포함해 `set -u`가 죽였습니다. 워크플로의 아티팩트 업로드가 아예 실행되지 않았을 것입니다. 로컬 `pg_dump`가 v14라 서버(16)와 안 맞아 그 앞에서 멈추는 바람에 여태 안 드러났습니다.

### 리뷰 반영 11건 (`#54`)

`TRUST_PROXY=Infinity` 우회(Express가 XFF 체인 전체 신뢰 → 레이트 리밋 무력화) · Sentry 트랜잭션·스팬 쿼리 스크러빙(API+Web 4곳, `beforeSend`는 에러만 통과) · Sentry ESM `--import` preload · 리포트 최초 작성 판정 원자화(unique 제약 선점) · 백업 암호화 강제 + 정리 순서 · `backup-staging`을 `environment: staging`으로 스코프 · HANDOFF 정정.

### 검증

`pnpm lint` · `typecheck`(e2e 포함) · `build` · `test` 전부 통과.

**테스트 수: API 246 → 299, web 361 → 377** — 기준선은 **세션 시작 시점 main(`3008285`)** 입니다(당시 API 246 · web 361).

> PR 코멘트들에는 구간별 중간 수치(`280 → 294`, `367 → 375` 등)가 적혀 있습니다. 각 라운드만 따로 센 값이라 기준선이 다릅니다. 다음 세션이 볼 기준은 위의 세션 전체 수치입니다.

실측 확인: 레이트 리밋 429·`Retry-After`·라우트별 버킷 · 컨테이너에서 `/api/health` 200 → postgres 중단 시 **503** → 복구 200 · 엔벨로프(성공 `{data:...}` / 204 본문 0바이트 / health 미포장 / 에러 형식 불변) · 백업 스크립트 4개 경로 · 마이그레이션 5건 "No difference detected".

## 미해결 / 결정 필요

1. **알림 durability** — `notifyScheduleEvent`가 예외를 삼켜서, 리포트 알림이 실패하면 리포트만 남고 이후 `generate`는 update 경로라 알림이 **영구히** 안 갑니다. 트랜잭셔널 아웃박스(새 테이블+워커)가 필요해 `#54`에서 보류했습니다. `#54`의 원자화 수정으로 중복은 막혔지만 누락은 남아 있습니다.
2. **배포 워크플로는 실행 검증이 안 됐습니다.** 문법·게이트 로직까지만 확인했습니다. 셋 다 기본값이 꺼짐이라 설정 전에는 CI를 깨뜨리지 않습니다. 켜는 법은 각 워크플로 상단 주석과 Notion 레이어 7 §7.5.
3. **백업 스토리지 대상 미선정.** 실행 위치는 결정했습니다 — GitHub Actions에서 운영 DB를 백업하지 않고, (1) DB 프로바이더 자동 백업/PITR + (2) DB 호스트 cron에서 `scripts/backup-db.sh` + `BACKUP_UPLOAD_CMD` 2단. 어느 오브젝트 스토리지로 보낼지가 남았습니다.
4. **API 이미지 1.78 GB.** devDependencies를 안고 갑니다. `pnpm deploy --prod`로 줄일 여지가 있으나 pnpm 심링크가 깨지면 런타임에만 드러나 검증 비용이 큽니다.
5. **`JoinCodeRotation` 웹 UI 없음.** 엔드포인트(`GET /organizations/:orgId/join-code/rotations`, OWNER 전용)만 열려 있습니다.
6. **`LoggingInterceptor`가 죽은 코드** — 등록된 적 없습니다. 요청 로깅을 켤지 결정 필요. (`AllExceptionsFilter`는 엔벨로프 통일 때 삭제)
7. **리포트 e2e 없음** (로컬 Ollama 의존). Ollama를 스텁으로 갈아끼울지 미결.
8. i18n·WCAG AA 브라우저 육안 확인. 두 번째 로케일 도입 여부 미결정 — `global-error.tsx`는 i18n을 못 쓰므로 별도 처리 필요.

## 다음 작업 후보 (우선순위 순)

1. **`#56` 머지.** main을 온전하게 만드는 것이 최우선입니다 — 지금 main에는 응답 엔벨로프 통일이 빠져 있습니다.
2. **배포 실제 연결** — Vercel 프로젝트 생성 + 시크릿 등록 후 `DEPLOY_WEB_ENABLED=true`. API는 GHCR이라 시크릿 없이 `DEPLOY_API_ENABLED=true`만으로 됩니다.
3. **알림 durability** (위 1번). 마이그레이션 1건이므로 단독 PR로.
4. `JoinCodeRotation` 웹 UI (기관 설정 화면).

## 참고

- **세션 리포트를 로컬에서 보려면 Ollama가 떠 있어야 합니다.** `OLLAMA_URL`(기본 `http://localhost:11434`)·`OLLAMA_MODEL`(기본 `qwen2.5:7b`). 안 떠 있으면 503이고 웹은 재시도 안내를 띄웁니다.
- **스키마를 바꾸면 반드시 `pnpm db:migrate`로 마이그레이션 파일을 남깁니다.** `db-check.yml`이 CI에서 드리프트를 잡습니다(`prisma/**` 변경 시에만 트리거).
- **e2e 실행 전 `pnpm dev`를 내려야 합니다.** `reuseExistingServer: false`라 3000·3001이 점유돼 있으면 즉시 에러입니다. 실행: `pnpm e2e:db:up` → `pnpm e2e:db:push` → `pnpm test:e2e`. 테스트 DB 5434(tmpfs), mailpit 1025. **e2e는 레이트 리밋을 자동으로 끕니다**(`THROTTLE_ENABLED: 'false'`).
- **레이트 리밋 수치는 환경변수로 못 바꿉니다.** `@Throttle` 데코레이터는 컨트롤러 import 시점에 평가되고 이는 `ConfigModule.forRoot()`가 `.env`를 읽기 전입니다(ESM import가 `AppModule` 클래스 본문보다 먼저 실행). 값은 `throttle.policy.ts` 상수, 환경변수로는 끄기만 됩니다.
- **`ConfigModule`은 타입 변환을 하지 않습니다.** `config.get<number>('X')`가 문자열을 돌려줍니다.
- **셸에서 변수 뒤에 한글이 바로 붙으면 `${VAR}`로 끊으세요.** bash가 첫 바이트를 변수명에 포함해 `set -u`와 만나면 죽습니다.
- **Notion MCP 쓰기 주의 2가지**: ① 본문에 `<script>` 문자열이 있으면 Cloudflare가 403으로 막습니다(레이어 7 작성 중 3회 차단 — `pnpm <script>`가 원인). 큰 페이로드는 나눠 보내세요. ② 한글 음절이 산발적으로 깨집니다 — `쪽`이 반복 실패했습니다. 쓴 뒤 매칭 안 될 문자열로 `update_content`를 호출해 에러 메시지의 에코로 검증하고, `old_str`은 짧게 잡으세요.
- **Sentry 스크러빙은 `apps/api/src/common/sentry-scrub.ts`와 `apps/web/src/shared/lib/sentry-scrub.ts` 두 곳에 있습니다.** 패키지 경계 때문에 복제했고 한쪽만 고치면 구멍이 남습니다.
- **`.claude/rules/`의 숫자 접두사가 제거됐습니다**(`bc9f82b`). `01-domain-naming.md` → `domain-naming.md` 식이고, **"규칙 04" 같은 번호 호칭은 이제 가리킬 대상이 없습니다** — 이름으로 부르세요(`prisma-migration` 규칙). 커밋 이력에는 옛 번호 표기가 남아 있습니다.
- **`flywheel-upgrade` 스킬의 규칙 갱신 대상 표에 `prisma-migration.md`·`shell-scripts.md`가 빠져 있습니다.** 규칙 자체는 `CLAUDE.md`가 디렉터리째 로드하므로 동작엔 문제없지만, 그 스킬이 자동으로 규칙을 추가할 때 이 둘은 후보에서 제외됩니다. 리네이밍과 무관한 별개 갭이라 손대지 않았습니다.
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. **레이어 3·4·5·6·7·8 전부 2026-09-08 기준 갱신.** 레이어 4는 스키마 사본 대신 `prisma/schema.prisma`를 정본으로 선언하도록 바꿨습니다(사본 유지가 반복 실패했기 때문).
- 모듈별 상세 구현 이력: Claude 메모리(`project_phase5_ops`, `eobom_ops_gotchas` 등)
