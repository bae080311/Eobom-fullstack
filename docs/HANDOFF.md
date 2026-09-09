# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 8.7 Decision Log를 참고하세요.

## 최근 완료

**알림 durability** — 알림 생성을 도메인 쓰기와 같은 트랜잭션에 넣었습니다. 아래 "이번 세션" 참조.

그 전 세션: **Phase 5(Ops) 전항목 + Phase 4.5 후속 항목** — 로드맵(Notion 레이어 8)에 열린 Phase가 없습니다. 레이트 리밋 · `/api/health` · API Dockerfile · `deploy-api`/`deploy-web`/`backup-staging` 워크플로 · Sentry(API+Web) · joinCode 회전 감사 로그 · 세션 리포트 알림 · 응답 엔벨로프 통일. `#49`~`#56` 전부 main에 있습니다.

> **교훈: PR의 base는 항상 main으로 두세요.** 스택 PR은 (1) 머지 순서가 엇갈리면 상위 내용이 main에 누락되고 (2) CodeRabbit이 base가 기본 브랜치가 아니면 리뷰를 아예 건너뜁니다. `#54`~`#56`에서 두 문제가 모두 실제로 터져 `#56`으로 뒷수습했습니다.

### 이번 세션 — 알림 durability

`NotificationsService.notifyScheduleEvent`가 **모든 예외를 삼키고 로그만 남기던 것**을 제거하고, 알림 insert를 도메인 쓰기와 같은 `$transaction`에 넣었습니다. 호출 5곳 전부(`schedules` create·createRecurring·update·cancel, `report` generate 최초 작성).

시그니처가 `notifyScheduleEvent(client, params)`로 바뀌었습니다 — 첫 인자는 `Prisma.TransactionClient | PrismaService`이고, **호출자는 반드시 도메인 쓰기와 같은 `tx`를 넘겨야 합니다.**

**아웃박스를 쓰지 않았습니다.** 이전 HANDOFF는 "트랜잭셔널 아웃박스(새 테이블+워커)"로 적어뒀지만, 알림의 전달 대상이 같은 Postgres의 `Notification` 행 하나뿐입니다 — 푸시·메일 등 외부 채널이 코드에도 로드맵에도 없습니다. 아웃박스는 DB 커밋과 **비트랜잭셔널 외부 side effect**를 잇는 장치인데 그 외부가 없어서, 아웃박스 테이블과 알림 테이블이 같은 트랜잭션 범위에 놓입니다. 실제 푸시가 붙는 시점에 이 트랜잭션 경계가 그대로 아웃박스 insert 자리가 됩니다. 배경은 Notion 레이어 8 §8.7의 2026-09-09 항목.

**의도된 동작 변경**: 조용한 누락 → 500. 알림을 남길 수 없으면 도메인 쓰기도 롤백되고 치료사가 재시도합니다.

### 작업 중 드러난 것 (그 전 세션) — 전부 "문서엔 있는데 실제론 없던" 것들

1. **`/api/health`가 아예 없었습니다.** Phase 1 DoD에 `[x]`인데 404였습니다.
2. **`.env.example`이 한 번도 커밋된 적이 없었습니다.** `.gitignore`가 `.env*` 목록에 섞어 무시하고 있어 `cp .env.example .env`가 새 클론에서 실패했습니다. 로컬 파일은 다른 프로젝트 템플릿 잔재였습니다.
3. **Docker 이미지가 조용히 깨졌습니다.** `.dockerignore`의 `*.tsbuildinfo`가 루트만 매칭 → `tsc --build`가 빌드를 건너뜀 → nest CLI가 `@eobom/shared`를 `.ts` 경로로 재작성 → **빌드는 성공하고 런타임에만 터짐.** 이제 Dockerfile이 빌드 단계에서 검사해 실패시킵니다.
4. **백업 스크립트가 성공해도 항상 `exit 1`이었습니다.** `$RETENTION_DAYS일보다...`에서 bash가 한글 '일'의 첫 바이트를 변수명에 포함해 `set -u`가 죽였습니다. 워크플로의 아티팩트 업로드가 아예 실행되지 않았을 것입니다. 로컬 `pg_dump`가 v14라 서버(16)와 안 맞아 그 앞에서 멈추는 바람에 여태 안 드러났습니다.

### 검증

`pnpm lint` · `typecheck`(e2e 포함) · `build` · `test` 전부 통과.

**테스트 수: API 299 → 308** (신규 9건 — 알림 실패 전파 3건, `create`/`createRecurring`/`update`/`cancel` 롤백 4건, 리포트 최초 생성 롤백 1건, tx 클라이언트 전달 1건). **web 377 유지** (이번 변경은 API 전용).

**실측 확인 — 개발 DB(5432)에 빌드된 실제 서비스를 붙여 확인했습니다.** `Notification`에 `CHECK (false) NOT VALID` 제약을 임시로 걸어 알림 insert만 실패시켰습니다:

- 정상 경로: 일정 생성 + 학부모 알림 1건 함께 커밋
- 알림 실패 시 `create`가 던지고 **`Schedule` 행이 남지 않음** (1 → 1)
- 알림 실패 시 `cancel`이 던지고 **status가 `SCHEDULED`에서 안 바뀜**
- 제약 해제 후 다시 정상 동작, 검증 데이터·제약 모두 정리 확인

> **e2e는 로컬에서 못 돌렸습니다.** 테스트 DB 포트 **5434를 다른 프로젝트 컨테이너(`job-mate-db-1`)가 점유**하고 있어 `pnpm e2e:db:up`이 바인딩에 실패합니다. CI(`ci.yml`의 e2e job)에서 돌아갑니다. 로컬에서 돌리려면 그 컨테이너를 먼저 내려야 합니다. (HANDOFF에 적혀 있던 "5433은 다른 컨테이너가 잡는다"와 같은 종류의 문제가 5434에도 생긴 것입니다.)

## 미해결 / 결정 필요

1. **배포 워크플로는 실행 검증이 안 됐습니다.** 문법·게이트 로직까지만 확인했습니다. 셋 다 기본값이 꺼짐이라 설정 전에는 CI를 깨뜨리지 않습니다. 켜는 법은 각 워크플로 상단 주석과 Notion 레이어 7 §7.5.
2. **백업 스토리지 대상 미선정.** 실행 위치는 결정했습니다 — GitHub Actions에서 운영 DB를 백업하지 않고, (1) DB 프로바이더 자동 백업/PITR + (2) DB 호스트 cron에서 `scripts/backup-db.sh` + `BACKUP_UPLOAD_CMD` 2단. 어느 오브젝트 스토리지로 보낼지가 남았습니다.
3. **API 이미지 1.78 GB.** devDependencies를 안고 갑니다. `pnpm deploy --prod`로 줄일 여지가 있으나 pnpm 심링크가 깨지면 런타임에만 드러나 검증 비용이 큽니다.
4. **`JoinCodeRotation` 웹 UI 없음.** 엔드포인트(`GET /organizations/:orgId/join-code/rotations`, OWNER 전용)만 열려 있습니다.
5. **`LoggingInterceptor`가 죽은 코드** — 등록된 적 없습니다. 요청 로깅을 켤지 결정 필요. (`AllExceptionsFilter`는 엔벨로프 통일 때 삭제)
6. **리포트 e2e 없음** (로컬 Ollama 의존). Ollama를 스텁으로 갈아끼울지 미결.
7. i18n·WCAG AA 브라우저 육안 확인. 두 번째 로케일 도입 여부 미결정 — `global-error.tsx`는 i18n을 못 쓰므로 별도 처리 필요.
8. **알림 payload의 `readAt`/`isRead` 명세 불일치** — Notion 레이어 5 §5.9 샘플은 `readAt`이지만 실제는 `isRead: boolean`입니다. 사소해서 의도적으로 두고 있습니다.

## 다음 작업 후보 (우선순위 순)

1. **배포 실제 연결** — Vercel 프로젝트 생성 + 시크릿 등록 후 `DEPLOY_WEB_ENABLED=true`. API는 GHCR이라 시크릿 없이 `DEPLOY_API_ENABLED=true`만으로 됩니다. **Vercel 계정 작업이 필요해 사람 손이 들어가야 합니다.**
2. `JoinCodeRotation` 웹 UI (기관 설정 화면). 엔드포인트는 이미 있어 웹 전용 작업이고 마이그레이션이 없습니다.
3. **`LoggingInterceptor` 정리** (위 5번). 켤지 지울지 결정만 하면 작은 작업입니다.
4. 리포트 e2e — Ollama를 스텁으로 갈아끼우는 방식 결정 후.

## 참고

- **세션 리포트를 로컬에서 보려면 Ollama가 떠 있어야 합니다.** `OLLAMA_URL`(기본 `http://localhost:11434`)·`OLLAMA_MODEL`(기본 `qwen2.5:7b`). 안 떠 있으면 503이고 웹은 재시도 안내를 띄웁니다.
- **스키마를 바꾸면 반드시 `pnpm db:migrate`로 마이그레이션 파일을 남깁니다.** `db-check.yml`이 CI에서 드리프트를 잡습니다(`prisma/**` 변경 시에만 트리거).
- **알림을 새로 보내는 코드를 추가할 때는 `notifyScheduleEvent(tx, params)`에 도메인 쓰기와 **같은** `tx`를 넘기세요.** 전역 `this.prisma`를 넘기면 타입은 통과하지만(첫 인자가 `Prisma.TransactionClient | PrismaService`) 롤백이 성립하지 않습니다. 이 경계를 지키는지 확인하는 단위 테스트가 각 호출부에 있습니다(`mock.calls[0][0]`이 `prisma.txClient`인지 단정).
- **e2e 테스트 DB 포트 5434를 다른 프로젝트 컨테이너가 잡고 있을 수 있습니다.** `docker ps`로 확인하고 내린 뒤 `pnpm e2e:db:up`을 실행하세요. 5433도 같은 이유로 이미 피한 포트입니다.
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
