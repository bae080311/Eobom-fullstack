# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 8.7 Decision Log를 참고하세요.

## 최근 완료 — Phase 5(Ops) 전항목 + Phase 4.5 미결 항목

**로드맵에 열린 Phase가 없습니다.** 마이그레이션 제약(규칙 04: 1 PR = 1 마이그레이션) 때문에 **5개 PR로 쪼갰고, 스택 구조라 번호 순서대로 머지해야 합니다.**

| PR                                                          | 내용                                                | 마이그레이션 |
| ----------------------------------------------------------- | --------------------------------------------------- | ------------ |
| [#49](https://github.com/bae080311/Eobom-fullstack/pull/49) | 레이트 리밋 + `ci.yml` 하드닝 + `.env.example` 정정 | 없음         |
| [#50](https://github.com/bae080311/Eobom-fullstack/pull/50) | `/api/health` + Dockerfile + deploy/backup 워크플로 | 없음         |
| [#51](https://github.com/bae080311/Eobom-fullstack/pull/51) | Sentry (API + Web)                                  | 없음         |
| [#52](https://github.com/bae080311/Eobom-fullstack/pull/52) | joinCode 회전 감사 로그                             | 1건          |
| [#53](https://github.com/bae080311/Eobom-fullstack/pull/53) | 세션 리포트 작성 알림                               | 1건          |

각 PR의 base가 앞 PR로 잡혀 있어 머지할수록 자동으로 main으로 내려옵니다.

### 작업 중 드러난 것 3가지 (전부 "문서엔 있는데 실제론 없던" 것들)

1. **`/api/health`가 아예 없었습니다.** 레이어 8 Phase 1 DoD에 `[x]`로 표시돼 있었지만 라우트가 없어 404였습니다. 컨테이너 프로브에 필수라 이번에 만들었고, DB까지 확인해 끊기면 503을 반환합니다.
2. **`.env.example`이 저장소에 없었습니다.** `.gitignore` 16번 줄이 `.env*` 목록에 섞어 무시하고 있어 **한 번도 커밋된 적이 없습니다.** `CLAUDE.md`의 `cp .env.example .env`가 새 클론에서 첫 줄부터 실패했습니다. 로컬에 남아 있던 파일은 다른 프로젝트 템플릿 잔재(Supabase·Telegram·"CTO loop alerts")였습니다.
3. **Dockerfile이 조용히 깨진 산출물을 굽습니다.** nest CLI는 `@eobom/shared`가 node_modules에서 해석되지 않으면 tsconfig `paths` 타깃(`.../src/index.ts`)으로 경로를 다시 씁니다. `shared/dist` 없이 api를 빌드하면 **빌드는 성공하고 런타임에만 `ERR_MODULE_NOT_FOUND`가 납니다.** 첫 이미지가 정확히 이렇게 깨졌습니다. 원인은 `.dockerignore`의 `*.tsbuildinfo`가 루트만 매칭해 `packages/shared/tsconfig.tsbuildinfo`가 이미지로 들어갔고, `tsc --build`가 "최신"으로 판단해 0.4초 만에 빌드를 건너뛴 것이었습니다. → Dockerfile이 빌드 단계에서 직접 검사해 실패시킵니다.

### 설계 판단 (되풀이하지 않도록)

- **레이트 리밋 수치는 환경변수로 못 바꿉니다.** `@Throttle` 데코레이터는 컨트롤러 import 시점에 평가되고 이는 `ConfigModule.forRoot()`가 `.env`를 읽기 **전**입니다(ESM import가 `AppModule` 클래스 본문보다 먼저 실행). 환경변수를 넣었다면 항상 기본값만 읽혀 조용히 무력화됐을 겁니다. 값은 `throttle.policy.ts` 상수이고, 환경변수로는 `THROTTLE_ENABLED=false` 끄기만 됩니다.
- **웹 Sentry는 동적 import입니다.** 정적 import 시 DSN이 없어도 First Load JS가 105 kB → **187 kB**로 늘었습니다. 동적 import로 106 kB(+1 kB). 대가는 init이 한 틱 늦는 것.
- **개인정보**: `sendDefaultPii: false` + `beforeSend`에서 request의 `data`·`cookies`·`query_string`·`headers` 삭제 + Session Replay 미도입. 아동 이름·치료 메모가 오갑니다.
- **감사 로그에 joinCode 값을 저장하지 않습니다.** 자격증명을 평문으로 영구 보관하는 셈이 됩니다.
- **리포트 알림은 최초 작성에만** 갑니다. 재생성은 upsert 덮어쓰기라 알림이 쌓이면 소음입니다.

### 검증

`pnpm lint` · `typecheck`(e2e 포함) · `build` · `test` 전부 통과. **API 246 → 280, web 361 → 367.**

실측으로 확인한 것:

- 레이트 리밋: login 11번째부터 429, `Retry-After: 600` 헤더, 라우트별 버킷 분리, `THROTTLE_ENABLED=false`로 해제
- Docker 이미지(1.78 GB) 빌드 후 컨테이너 기동 → `/api/health` 200 → postgres 중단 시 **503** → 복구 시 200
- Sentry 붙인 뒤에도 400·401·404 응답 형식 불변
- 마이그레이션 2건 모두 빈 shadow DB에서 "No difference detected"

## 미해결 / 결정 필요

1. **배포 워크플로는 실행 검증이 안 됐습니다.** 시크릿·Vercel 프로젝트·레지스트리가 없어 문법과 게이트 로직까지만 확인했습니다. 셋 다 기본값이 꺼짐이라 설정 전에는 CI를 깨뜨리지 않습니다. 켜는 법은 각 워크플로 파일 상단 주석과 Notion 레이어 7 §7.5에 있습니다.
2. **백업 실행 위치.** `backup.yml`을 켜면 운영 DB가 GitHub 러너 IP에서 접근 가능해야 하고 자격증명이 Secrets에 놓입니다. **DB 호스트에서 cron으로 `scripts/backup-db.sh`를 돌리는 편이 노출면이 훨씬 좁습니다.** 아티팩트 보존 상한도 90일이라 장기 보관용이 아닙니다.
3. **응답 엔벨로프가 report 모듈만 다릅니다.** `report`만 레이어 5 §5.1의 `{ data: ... }`를 지키고 나머지는 DTO를 그대로 반환합니다(규약을 지키는 쪽이 소수). `AllExceptionsFilter`도 `main.ts`에 등록되지 않은 죽은 코드입니다. 둘을 "응답 형식 정리" PR로 묶는 것을 권합니다 — 이번엔 손대지 않았습니다.
4. **API 이미지 1.78 GB.** devDependencies를 그대로 안고 갑니다. `pnpm deploy --prod`로 줄일 여지가 있으나 pnpm 심링크 구조가 깨지면 런타임에만 드러나 검증 비용이 큽니다.
5. **`JoinCodeRotation` 웹 UI 없음.** 엔드포인트(`GET /organizations/:orgId/join-code/rotations`, OWNER 전용)만 열려 있습니다.
6. **리포트 e2e 없음** (로컬 Ollama 의존). Ollama를 스텁으로 갈아끼울지 미결.
7. i18n·WCAG AA 브라우저 육안 확인. 두 번째 로케일 도입 여부 여전히 미결정 — `global-error.tsx`는 i18n을 못 쓰므로 별도 처리 필요.

## 다음 작업 후보 (우선순위 순)

1. **PR #49~#53 순서대로 머지.** 스택이라 순서가 중요합니다.
2. **응답 형식 정리** — 위 3번. 엔벨로프 통일 + `AllExceptionsFilter` 등록 여부 결정 + 레이어 5 §5.1 문서를 실제에 맞추기.
3. **배포 실제 연결** — Vercel 프로젝트 생성 + 시크릿 등록 후 `DEPLOY_WEB_ENABLED=true`. API는 GHCR이라 시크릿 없이 `DEPLOY_API_ENABLED=true`만으로 됩니다.
4. `JoinCodeRotation` 웹 UI (기관 설정 화면).

## 참고

- **세션 리포트를 로컬에서 보려면 Ollama가 떠 있어야 합니다.** `OLLAMA_URL`(기본 `http://localhost:11434`)·`OLLAMA_MODEL`(기본 `qwen2.5:7b`). 안 떠 있으면 503이 나고 웹은 재시도 안내를 띄웁니다.
- **스키마를 바꾸면 반드시 `pnpm db:migrate`로 마이그레이션 파일을 남겨야 합니다.** `db-check.yml`이 CI에서 드리프트를 잡습니다(`prisma/**` 변경 시에만 트리거).
- **e2e 실행 전 `pnpm dev`를 내려야 합니다.** `reuseExistingServer: false`라 3000·3001이 점유돼 있으면 Playwright가 즉시 에러를 냅니다.
- e2e 실행: `pnpm e2e:db:up` → `pnpm e2e:db:push` → `pnpm test:e2e`. 테스트 DB는 5434(tmpfs), mailpit은 1025. **e2e는 레이트 리밋을 자동으로 끕니다**(`playwright.config.ts`의 `THROTTLE_ENABLED: 'false'`) — 같은 IP에서 회원가입·로그인을 반복하기 때문입니다.
- e2e 작성 시 주의: 폼의 `<label>`이 `htmlFor`로 input과 연결돼 있지 않아 `getByLabel`이 동작하지 않습니다. placeholder·role 기준으로 잡았고 `data-testid`는 도입하지 않았습니다.
- **환경변수를 숫자·불리언으로 쓸 때는 직접 변환해야 합니다.** `ConfigModule.forRoot({ isGlobal: true })`는 타입 변환을 하지 않아 `config.get<number>('X')`가 문자열을 돌려줍니다.
- **Notion MCP 쓰기 시 주의 2가지**: ① 본문에 `<script>` 문자열이 들어가면 Cloudflare가 403으로 막습니다(이번 세션에서 레이어 7 작성 중 3회 차단 — `pnpm <script>`라고 쓴 것이 원인이었습니다). 큰 페이로드도 나눠서 보내는 편이 안전합니다. ② 한글 음절이 산발적으로 깨질 수 있으니, 쓴 뒤 매칭되지 않을 문자열로 `update_content`를 호출해 에러 메시지의 에코를 확인하세요. 이번 세션에서 레이어 8의 기존 손상 9건을 고쳤습니다.
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. **레이어 3·4·5·6·7·8 전부 2026-09-08 기준으로 갱신**했습니다. 특히 레이어 4는 스키마 사본 대신 `prisma/schema.prisma`를 정본으로 선언하도록 바꿨습니다(사본 유지가 반복해서 실패했기 때문).
- 모듈별 상세 구현 이력: Claude 메모리(`project_phase2_modules` 등)
