# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 8.8 Decision Log를 참고하세요.

## 최근 완료

**계정 삭제(`DELETE /users/me`)** — Phase 6 항목 3. Apple 5.1.1(v) 스토어 블로커를 닫았습니다. 아래 "이번 세션" 참조.

그 전 세션: **알림 durability** — 알림 생성을 도메인 쓰기와 같은 `$transaction`에 넣었습니다(PR `#57` 머지). `notifyScheduleEvent(client, params)`의 첫 인자에 반드시 도메인 쓰기와 **같은 `tx`**를 넘기세요.

## 이번 세션 — 계정 삭제

Apple 심사지침 **5.1.1(v)** 스토어 블로커였습니다. `users.controller.ts`에 `@Get('me')`·`@Patch('me')`뿐이고 `DELETE`가 없었습니다.

### 방식: 소프트 삭제 + 즉시 익명화

**물리 삭제는 스키마가 이미 막고 있습니다.** `Schedule`·`RecurringRule`·`InviteCode`·`Organization`·`JoinCodeRotation`이 `TherapistProfile`을 `onDelete` 미지정(= **Restrict**)으로 참조합니다. 일정을 하나라도 만든 치료사의 `User` 행은 DB가 지우기를 거부합니다. 그 기록들은 기관 자산이라 남는 것이 맞습니다.

익명화 대상 — `User.email`(→ `deleted+<userId>@deleted.eobom.local`, unique 충돌 없음) · `User.name`(→ `탈퇴한 사용자`) · `User.passwordHash`(랜덤 argon2 해시로 덮음) · `TherapistProfile.licenseNumber` · `ParentProfile.phoneNumber`.

| 역할   | 지우는 것                                   | 남기는 것                                                                                                      |
| ------ | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 치료사 | ACTIVE 멤버십 → `LEFT`(+`leftAt`), 면허번호 | `Schedule`·`SessionReport`·`InviteCode`·`Organization`·`JoinCodeRotation` — 전부 기관 자산                     |
| 학부모 | `ParentChildLink`, `Notification`, 전화번호 | `Child`(기관 자산·다른 학부모가 있을 수 있음), `ScheduleAcknowledgement`, `InviteCode.usedByParent`(감사 흔적) |

### 같이 고쳐야 했던 것 — `JwtStrategy`가 DB를 안 봤습니다

`validate()`가 JWT payload만으로 `IUser`를 조립하고 `createdAt`/`updatedAt`은 `new Date()`로 채우고 있었습니다. 즉 `request.user`는 "DB가 말하는 사용자"가 아니라 **"토큰이 말하는 사용자"**였고, `@CurrentUser()`를 쓰는 **33개 핸들러 전부**가 그것을 신뢰했습니다.

계정을 지워도 access token 수명(**15분**) 동안 보호된 라우트가 전부 열린 채 남습니다. 게다가 소프트 삭제는 행이 남으므로 `refresh()`의 `findById` 존재 확인도 그대로 통과해 **7일짜리 refresh로 무한 재발급**됩니다. 그래서:

- `JwtStrategy.validate`가 `usersService.findById`로 사용자 행을 다시 읽습니다 (요청당 PK 조회 1회). 덤으로 `createdAt`/`updatedAt`이 실제 값이 됐습니다.
- `UsersService.findById`/`findByEmail`이 `findFirst` + `deletedAt: null`로 바뀌었습니다. **인증 경로(JwtStrategy·login·refresh)가 전부 이 둘을 거치므로, 탈퇴 차단은 여기 한 곳에서만 성립합니다.** `getMe`/`updateMe` 같은 개별 서비스에는 필터를 넣지 않았습니다 — 게이트는 인증 레이어 하나로 둡니다.

### 마지막 OWNER 규칙

`organizations.service.ts`의 `assertNotLastOwner`를 그대로 쓰지 않았습니다. 그건 특정 org 하나를 보지만, 탈퇴는 **그 사람이 OWNER인 모든 org**를 봐야 합니다. `UsersService.assertOwnedOrgsKeepAnOwner`가 org마다 확인합니다.

- 남은 ACTIVE 멤버가 **있는데** 남은 ACTIVE OWNER가 0명 → **400 차단** ("소유자를 넘긴 뒤 탈퇴해주세요")
- 남은 ACTIVE 멤버가 **0명**(1인 기관) → **통과**. 여기서 막으면 1인 치료사가 영원히 탈퇴하지 못해 5.1.1(v)를 다시 위반합니다.

트랜잭션은 `Serializable`입니다 — `leaveMember`와 같은 read-modify-write 경쟁입니다. argon2 검증·해시(각 100ms 수준)는 트랜잭션 **밖**에서 끝냅니다.

### 그 외

- `deleteAccountSchema`(비밀번호 재확인)를 `packages/shared/src/dto/user.dto.ts`에 추가. **DELETE에 본문을 싣습니다** — ky·express 모두 통과시킵니다. `api.delete`는 `RequestOptions extends Options`라 `{ token, json }`이 그대로 전달돼 클라이언트 수정이 없었습니다.
- 레이트 리밋 `deleteAccount: 5회/10분` — 비밀번호를 받으므로 브루트포스 표면입니다.
- 웹: `features/delete-account` 신규 슬라이스(`useDeleteAccount` → `useDeleteAccountAction` → `DeleteAccountDialog`/`DeleteAccountButton`), `MyInfoView` 메뉴 최하단에 연결. 성공 시 `tokenStorage.clear()` + `/login`.

### 검증

`pnpm lint` · `typecheck`(e2e 포함) · `build` · `test` 전부 통과.

**테스트 수: API 308 → 324** (신규 16건 — deleteMe 9, JwtStrategy 3, findById/findByEmail 2, UsersController 3 중 신규 1 + 기존 이관). **web 377 → 385** (신규 8건).

**실측 확인 — 개발 DB(5432)에 빌드된 실제 서비스를 붙여 확인했습니다.** 치료사 2명(OWNER+THERAPIST)·학부모 1명·기관·아동·일정·알림을 시드하고:

| 확인                            | 결과                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 잘못된 비밀번호                 | `401`, 아무것도 쓰지 않음                                                                                        |
| 멤버가 남은 기관의 마지막 OWNER | `400` 차단                                                                                                       |
| 학부모 탈퇴 전/후 **같은 토큰** | `GET /users/me` **200 → 401** (핵심)                                                                             |
| 탈퇴한 이메일로 재로그인        | `401`                                                                                                            |
| 학부모 탈퇴 후 DB               | `ParentChildLink` 1→0, `Notification` 1→0, **`Child` 보존**                                                      |
| 비-OWNER 치료사 탈퇴            | `204`                                                                                                            |
| 1인 기관이 된 OWNER 탈퇴        | `204` (차단 안 함)                                                                                               |
| 치료사 탈퇴 후 DB               | 멤버십 `LEFT`+`leftAt`, **`Schedule`·`Child`·`Organization` 보존**, 표시명 "탈퇴한 사용자", `licenseNumber` null |

검증 데이터·임시 스크립트는 모두 정리했습니다(`org/user/child/schedule` 잔여 0건 확인).

> **e2e는 로컬에서 못 돌렸습니다.** 테스트 DB 포트 **5434를 `job-mate-db-1`이 여전히 점유** 중입니다. CI(`ci.yml`의 e2e job)에서 돌아갑니다.

## 미해결 / 결정 필요

1. **기관이 멤버 0명으로 남을 수 있습니다.** 1인 기관 OWNER가 탈퇴하면 org·아동·일정은 남고 ACTIVE 멤버가 0명이 됩니다. joinCode도 살아 있어 코드를 아는 사람이 THERAPIST로 합류할 수 있지만 OWNER는 영원히 0명입니다. 기관 아카이빙/삭제 정책이 필요합니다 — 이번 범위 밖으로 뒀습니다.
2. **`Child.primaryTherapistId`가 탈퇴한 치료사를 계속 가리킵니다.** 화면에 "탈퇴한 사용자"로 뜹니다. 조용히 `null`로 만드는 것보다 재배정이 필요하다는 사실이 보이는 편이 낫다고 판단했습니다. OWNER 재배정 UI가 이미 있습니다(`manage-child`).
3. **탈퇴 계정 하드 삭제(purge) 정책 미정.** 보관 기간을 정해 배치로 지울지 미결. 스케줄러 인프라가 아직 없습니다.
4. **배포 워크플로는 실행 검증이 안 됐습니다.** 셋 다 기본값 꺼짐. 켜는 법은 각 워크플로 상단 주석과 Notion 레이어 7 §7.5.
5. **백업 스토리지 대상 미선정.** 실행 위치는 결정 — GitHub Actions가 아니라 (1) DB 프로바이더 자동 백업/PITR + (2) DB 호스트 cron `scripts/backup-db.sh` + `BACKUP_UPLOAD_CMD`.
6. **API 이미지 1.78 GB.** devDependencies를 안고 갑니다.
7. **`JoinCodeRotation` 웹 UI 없음.** 엔드포인트(`GET /organizations/:orgId/join-code/rotations`, OWNER 전용)만 열려 있습니다.
8. **`LoggingInterceptor`가 죽은 코드** — 등록된 적 없습니다. 켤지 지울지 결정 필요.
9. **리포트 e2e 없음** (로컬 Ollama 의존). Ollama 스텁 여부 미결.
10. i18n·WCAG AA 브라우저 육안 확인. `global-error.tsx`는 i18n을 못 씁니다.
11. **알림 payload의 `readAt`/`isRead` 명세 불일치** — Notion 레이어 5 §5.9는 `readAt`, 실제는 `isRead: boolean`. 사소해서 의도적으로 둡니다.

## 다음 작업 후보 (우선순위 순)

Phase 6(네이티브 앱)에서 남은 것:

1. **웹 배포 실연결** — Vercel 프로젝트 + 시크릿 3종 → `DEPLOY_WEB_ENABLED=true`. **사람 손이 필요합니다.** `server.url`이 가리킬 도메인이 없으면 Capacitor 착수가 불가능합니다.
2. **개인정보처리방침 페이지** — 아동 이름·치료 메모는 건강 관련 민감정보라 App Privacy 라벨과 함께 스토어 필수인데 서비스에 페이지 자체가 없습니다. 웹 전용·마이그레이션 없음.
3. **`DeviceToken` 테이블 + `POST /devices`·`DELETE /devices/:token`** (마이그레이션 1건).
4. **FCM 발송** — `firebase-admin`, `UNREGISTERED` 응답 시 토큰 행 삭제.
5. **Capacitor 셸**(`apps/mobile`) + 웹 브릿지 client 컴포넌트 1개.

그 외: `JoinCodeRotation` 웹 UI · `LoggingInterceptor` 정리 · 리포트 e2e.

## 참고

- **인증에서 "이 사용자가 존재하는가"를 판단하는 곳은 `UsersService.findById`/`findByEmail` 둘뿐입니다.** 새 인증 경로를 만들면 반드시 이 둘을 거치게 하세요. 직접 `prisma.user.findUnique`를 쓰면 탈퇴 계정이 통과합니다.
- **알림을 새로 보내는 코드를 추가할 때는 `notifyScheduleEvent(tx, params)`에 도메인 쓰기와 **같은** `tx`를 넘기세요.** 전역 `this.prisma`를 넘기면 타입은 통과하지만 롤백이 성립하지 않습니다.
- **세션 리포트를 로컬에서 보려면 Ollama가 떠 있어야 합니다.** `OLLAMA_URL`(기본 `http://localhost:11434`)·`OLLAMA_MODEL`(기본 `qwen2.5:7b`). 안 떠 있으면 503.
- **스키마를 바꾸면 반드시 `pnpm db:migrate`로 마이그레이션 파일을 남깁니다.** `db-check.yml`이 CI에서 드리프트를 잡습니다(`prisma/**` 변경 시에만 트리거).
- **e2e 테스트 DB 포트 5434를 다른 프로젝트 컨테이너가 잡고 있을 수 있습니다.** `docker ps`로 확인하고 내린 뒤 `pnpm e2e:db:up`. 5433도 같은 이유로 이미 피한 포트입니다.
- **e2e 실행 전 `pnpm dev`를 내려야 합니다.** `reuseExistingServer: false`. 실행: `pnpm e2e:db:up` → `pnpm e2e:db:push` → `pnpm test:e2e`. 테스트 DB 5434(tmpfs), mailpit 1025. e2e는 레이트 리밋을 자동으로 끕니다(`THROTTLE_ENABLED: 'false'`).
- **레이트 리밋 수치는 환경변수로 못 바꿉니다.** `@Throttle` 데코레이터는 컨트롤러 import 시점에 평가되고 이는 `ConfigModule.forRoot()`가 `.env`를 읽기 전입니다. 값은 `throttle.policy.ts` 상수, 환경변수로는 끄기만 됩니다.
- **`ConfigModule`은 타입 변환을 하지 않습니다.** `config.get<number>('X')`가 문자열을 돌려줍니다.
- **PR의 base는 항상 main으로 두세요.** 스택 PR은 머지 순서가 엇갈리면 상위 내용이 누락되고, CodeRabbit이 base가 기본 브랜치가 아니면 리뷰를 건너뜁니다.
- **셸에서 변수 뒤에 한글이 바로 붙으면 `${VAR}`로 끊으세요.** bash가 첫 바이트를 변수명에 포함해 `set -u`와 만나면 죽습니다.
- **Notion MCP 쓰기 주의 2가지**: ① 본문에 `<script>` 문자열이 있으면 Cloudflare가 403으로 막습니다. 큰 페이로드는 나눠 보내세요. ② 한글 음절이 산발적으로 깨집니다 — 쓴 뒤 검증하고 `old_str`은 짧게 잡으세요.
- **Sentry 스크러빙은 `apps/api/src/common/sentry-scrub.ts`와 `apps/web/src/shared/lib/sentry-scrub.ts` 두 곳에 있습니다.** 한쪽만 고치면 구멍이 남습니다.
- **`.claude/rules/`의 숫자 접두사는 제거됐습니다**(`bc9f82b`). "규칙 04" 같은 번호 호칭은 가리킬 대상이 없습니다 — 이름으로 부르세요(`prisma-migration` 규칙).
- **`graphify-out/`은 `.gitignore`에 있습니다.** 코드베이스 지식 그래프 생성물이고 `/graphify .`로 재생성합니다. docs·이미지 시맨틱 추출은 `GEMINI_API_KEY`가 있어야 채워집니다.
- 레이어 정본 문서: `CLAUDE.md` 상단 Notion 표. 레이어 4는 스키마 사본 대신 `prisma/schema.prisma`를 정본으로 선언합니다.
