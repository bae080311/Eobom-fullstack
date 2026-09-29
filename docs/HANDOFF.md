# Handoff

> 매 작업 세션(`git-ship` 실행) 마지막에 자동으로 덮어써지는 문서입니다. **최신 상태만** 유지하고 과거 이력은 남기지 않습니다 — 이력이 필요하면 git log·PR·Notion 8.8 Decision Log를 참고하세요.

## 최근 완료

이번 세션에 PR 2개를 올렸습니다.

- **`#63` Capacitor iOS 웹뷰 셸 + safe-area 수정** — Phase 6 항목 6. Phase 6 전체를 떠받치던 쿠키 인증 가정을 실측으로 닫았습니다.
- **`#64` `/users/me` 가 `passwordHash` 를 노출하던 것 수정** — `#63` 검증 중 발견한 별개 보안 이슈.

그 전: 계정 삭제(`DELETE /users/me`, `#58`), 모달 포커스·접근성(`#60`), 알림 durability(`#57`).

## 이번 세션 ① — Capacitor 셸 (`#63`)

`apps/web` 을 한 줄도 고치지 않고 배포 사이트를 원격 URL(`server.url`)로 가리키는 얇은 네이티브 셸(`apps/mobile`). Capacitor 8.5.2, iOS만(SPM이라 Pods 없음).

**Decision Log 2026-09-09 의 전제를 실측으로 확인했습니다.** "원격 URL이면 웹뷰 오리진이 사이트 오리진과 같아 쿠키 인증이 그대로 동작한다" — iOS 26.5 시뮬레이터에서 4단계 전부 확인: 원격 사이트 렌더 → cross-origin API 왕복 → `document.cookie` 유지 → 이동 후 **미들웨어·RSC가 쿠키를 읽어** 로그인된 대시보드 렌더.

> **`server.allowNavigation` 이 없으면 세션이 통째로 날아갑니다.** 빠지면 client-side 네비게이션이 **Safari로 빠져나가고**, 웹뷰와 Safari는 쿠키 저장소가 달라 로그인 상태가 사라집니다. 실제로 이 증상을 먼저 만났습니다(대시보드로 갔더니 Safari에서 로그인 화면). `capacitor.config.ts` 가 `server.url` 의 호스트를 자동으로 넣습니다.

**safe-area 는 지금까지 아무 일도 하지 않고 있었습니다.** `viewportFit: 'cover'` 가 없어 `env(safe-area-inset-*)` 가 항상 0이었고, 컴파일된 CSS에서 `.safe-area-inset-bottom` 이 `.pb-2` 를 이겨 **탭바 하단 여백이 8px가 아니라 0**이었습니다. 유틸리티를 없애고 각 호출부에서 `pb-[calc(0.5rem+env(safe-area-inset-bottom))]` 처럼 기본값을 calc에 흡수했습니다. 브라우저·PWA에서도 고쳐지는 버그입니다.

## 이번 세션 ② — `/users/me` 의 `passwordHash` 노출 (`#64`)

`UsersService.getMe`/`updateMe` 가 Prisma 행을 통째로 반환해 **argon2 해시가 클라이언트까지 내려갔습니다.** 프로필도 `id`·`userId` 가 함께 나갔습니다. 웹은 렌더하지 않지만 네트워크 응답·프록시 로그·Sentry breadcrumb에는 남습니다 — 전에 고친 `rawMemo` 유출(레이어 5 §5.10 간극 ②)과 같은 유형입니다.

`ME_SELECT` 상수로 7개 필드만 `select` 하도록 못박았습니다. **`include` 가 아니라 `select` 인 것이 핵심**입니다 — `User` 에 컬럼이 늘어도 자동으로 새지 않습니다. 새 필드 노출은 `ME_SELECT` 에 명시적으로 추가해야 하고, 단위 테스트가 `include` 로 돌아가는 것을 막습니다.

계약은 `packages/shared` 의 `UserProfileResponseDto` 로 고정했습니다.

## 검증

`pnpm lint` · `typecheck` · `build` · `test` 전부 통과. **API 324 → 325**, web 396 유지.

**실측 확인**

- `#63`: iOS 26.5 시뮬레이터에서 앱 실행 → 로그인 → 대시보드가 **웹뷰 안에서** 렌더(헤더에 계정 이름)
- `#64`: 개발 DB + 빌드된 서비스로 `GET`·`PATCH /users/me` 호출 → 응답에 `passwordHash`·`emailVerifiedAt`·`deletedAt`·프로필 `id` 전부 없음, 웹이 쓰는 7개 필드만 존재

검증용 계정·기관·하네스 파일·임시 스크립트는 모두 삭제했습니다(잔여 0건 확인).

## 미해결 / 결정 필요

1. **Notion 레이어 문서를 갱신하지 못했습니다.** 세션 도중 Notion MCP 연결이 **다른 워크스페이스**(정재원컴퍼니 / s24049@gsm.hs.kr)로 바뀌어 이어봄 페이지에 접근할 수 없습니다. 재연결 후 **레이어 5 §5.4**(`/users/me` 응답 필드 + `passwordHash` 유출 이력)와 **레이어 8 §8.7**(Phase 6 항목 6 완료 + Decision Log)를 채워야 합니다.
2. **번들 ID 가 임시값**(`kr.co.eobom.app`). 도메인 확정 시 바꾸고 `npx cap add ios` 재생성 필요 — **늦을수록 비쌉니다.**
3. **가로 방향이 열려 있습니다.** `Info.plist` 가 Capacitor 기본값인데 웹 UI는 하단 탭바 고정의 세로 전용 레이아웃입니다.
4. `maximumScale: 1, userScalable: false` 는 WCAG 1.4.4(200% 확대) 위반 소지. 웹뷰로 가면 더 눈에 띕니다.
5. **Android 없음.** 로컬에 SDK가 없어 `cap add android` 미실행. Play는 신규 개인 개발자에게 테스터 20명·**14일 연속 비공개 테스트**를 요구하므로 일정에 미리 넣어야 합니다.
6. **기관이 ACTIVE 멤버 0명으로 남을 수 있습니다** (1인 기관 OWNER 탈퇴). 기관 아카이빙 정책 필요.
7. **탈퇴 계정 하드 삭제(purge) 정책 미정.** 스케줄러 인프라가 없습니다.
8. **배포 워크플로 실행 검증 안 됨.** 셋 다 기본값 꺼짐.
9. **백업 스토리지 대상 미선정.**
10. **API 이미지 1.78 GB.**
11. **`JoinCodeRotation` 웹 UI 없음.** · **`LoggingInterceptor` 죽은 코드** · **리포트 e2e 없음**(Ollama 의존) · 알림 payload `readAt`/`isRead` 명세 불일치(의도적)

## 다음 작업 후보 (우선순위 순)

1. **웹 배포 실연결** — Vercel 프로젝트 + 시크릿 3종 → `DEPLOY_WEB_ENABLED=true`. **사람 손 필요.** 셸이 가리킬 실제 도메인이 없으면 스토어 제출이 불가능합니다.
2. **개인정보처리방침 페이지** — 아동 이름·치료 메모는 건강 관련 민감정보라 App Privacy 라벨과 함께 스토어 필수인데 페이지 자체가 없습니다. 웹 전용·마이그레이션 없음.
3. **`DeviceToken` 테이블 + `POST /devices`·`DELETE /devices/:token`** (마이그레이션 1건).
4. **FCM 발송** — `firebase-admin`, `UNREGISTERED` 응답 시 토큰 행 삭제.
5. **웹 브릿지** — `window.Capacitor` 감지 → 권한 요청 → 토큰 등록 → 알림 탭 딥링크. client 컴포넌트 1개.

## 참고

- **네이티브 셸을 로컬에서 띄우는 법·주의사항은 `apps/mobile/README.md`** 에 있습니다. 특히 **`pnpm dev`(turbo)로는 `WEB_URL` 이 API에 전달되지 않습니다** — turbo가 미선언 환경변수를 거릅니다. LAN IP로 띄우면 CORS가 어긋나는데 웹뷰에서는 `TypeError: Load failed` 로만 보여 원인을 찾기 어렵습니다. `pnpm --filter` 로 각각 띄우세요.
- **`server.url` 은 `cap sync` 시점에 네이티브 프로젝트로 구워집니다.** 주소를 바꾸면 sync를 다시 해야 합니다.
- **Xcode 26.6 은 iOS 26.5 플랫폼이 필요합니다.** 없으면 iOS destination이 0개라 빌드가 안 됩니다(`xcodebuild -downloadPlatform iOS`, 약 8.5GB).
- **`| tail` 로 파이프하면 종료 코드가 가려집니다.** 빌드 실패가 exit 0으로 보였습니다 — 파이프라인 뒤 `$?` 는 마지막 명령(`tail`)의 것입니다.
- **응답에 새 필드를 노출할 때는 `ME_SELECT` 처럼 `select` 로 못박으세요.** `include`·행 통째 반환은 컬럼이 늘 때 조용히 샙니다.
- **인증에서 "이 사용자가 존재하는가"를 판단하는 곳은 `UsersService.findById`/`findByEmail` 둘뿐입니다.** 직접 `prisma.user.findUnique` 를 쓰면 탈퇴 계정이 통과합니다.
- **알림을 새로 보내는 코드에는 `notifyScheduleEvent(tx, params)` 에 도메인 쓰기와 같은 `tx`** 를 넘기세요. 전역 `this.prisma` 는 타입은 통과하지만 롤백이 성립하지 않습니다.
- **세션 리포트를 로컬에서 보려면 Ollama가 떠 있어야 합니다.** `OLLAMA_URL`·`OLLAMA_MODEL`. 없으면 503.
- **스키마를 바꾸면 반드시 `pnpm db:migrate`.** `db-check.yml` 이 CI에서 드리프트를 잡습니다(`prisma/**` 변경 시에만).
- **e2e 테스트 DB 포트 5434를 다른 프로젝트 컨테이너가 잡고 있을 수 있습니다.** 실행 전 `pnpm dev` 를 내려야 합니다(`reuseExistingServer: false`).
- **레이트 리밋 수치는 환경변수로 못 바꿉니다.** `@Throttle` 은 컨트롤러 import 시점에 평가되고 이는 `.env` 를 읽기 전입니다. 값은 `throttle.policy.ts` 상수, 환경변수로는 끄기만 됩니다.
- **PR의 base는 항상 main으로.** 스택 PR은 머지 순서가 엇갈리면 내용이 누락되고 CodeRabbit이 리뷰를 건너뜁니다.
- **Sentry 스크러빙은 api·web 두 곳에 복제돼 있습니다.** 한쪽만 고치면 구멍이 남습니다.
- **`graphify-out/` 은 gitignore** 대상입니다. `/graphify .` 로 재생성하며, docs·이미지 시맨틱 추출은 `GEMINI_API_KEY` 가 있어야 채워집니다.
