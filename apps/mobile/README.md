# @eobom/mobile

`apps/web`을 그대로 띄우는 얇은 네이티브 셸. Capacitor + **원격 URL**(`server.url`) 구조다.

웹 앱을 번들로 동봉하지 않는다. 웹은 서버 렌더링이고 RSC에서 `cookies()`로 `eobom_access`를 읽는 페이지가 14개라, 정적 번들(`output: 'export'`)로 바꾸려면 모든 페이지를 클라이언트 페칭으로 옮기고 JWT를 httpOnly 쿠키에서 네이티브 저장소로 내려야 한다 — 웹 앱 전면 재작성이다. 원격 URL이면 **웹뷰 오리진이 사이트 오리진과 같아 쿠키 인증이 손대지 않은 채 그대로 동작한다.** 배경은 Notion 레이어 8 §8.7 / Decision Log 2026-09-09.

## 로컬에서 띄우기

```bash
# 1) 웹·API dev 서버 (저장소 루트에서)
pnpm dev

# 2) 셸이 가리킬 주소를 굽고 시뮬레이터에서 실행
cd apps/mobile
EOBOM_MOBILE_SERVER_URL=http://localhost:3000 pnpm sync
pnpm exec cap run ios
```

`server.url`은 **`cap sync` 시점에 네이티브 프로젝트로 구워진다**(`ios/App/App/capacitor.config.json`). 주소를 바꾸면 sync를 다시 해야 한다. 그 파일은 생성물이라 `.gitignore`에 있다.

- **iOS 시뮬레이터**는 호스트와 네트워크 스택을 공유하므로 `http://localhost:3000`이 그대로 닿는다.
- **실기기**는 맥의 LAN IP를 쓴다 (`EOBOM_MOBILE_SERVER_URL=http://192.168.0.x:3000`). 같은 Wi-Fi여야 하고, iOS 14+의 로컬 네트워크 권한 프롬프트가 뜰 수 있다.
- `http`가 허용되는 것은 `Info.plist`의 `NSAppTransportSecurity > NSAllowsLocalNetworking` 덕분이다. ATS를 통째로 끄는 `NSAllowsArbitraryLoads`가 아니라 localhost·LAN 주소에만 열어 둔 좁은 예외라 심사에서 문제되지 않는다.

### LAN IP로 띄울 때 같이 맞춰야 하는 것 (2026-09-28 실측)

웹이 `localhost`가 아닌 주소로 열리면 **API의 CORS와 웹의 API 주소가 함께 어긋난다.**

```bash
# API: CORS origin 을 웹뷰가 실제로 쓰는 오리진으로
WEB_URL=http://192.168.0.x:3000 pnpm --filter api dev

# web: 클라이언트가 호출할 API 주소도 같은 호스트로
NEXT_PUBLIC_API_URL=http://192.168.0.x:3001/api pnpm --filter web dev
```

> **`pnpm dev`(turbo)로는 이 환경변수들이 전달되지 않는다.** turbo 는 선언되지 않은 환경변수를 태스크에 넘기지 않아 `WEB_URL` 이 조용히 무시되고, API 는 계속 `http://localhost:3000` 만 CORS 허용한다(`Access-Control-Allow-Origin` 헤더로 확인됨). 웹뷰에서는 이것이 `TypeError: Load failed` 로만 보여 원인을 찾기 어렵다. 위처럼 `pnpm --filter` 로 각각 띄우거나 `turbo.json` 에 env 를 선언해야 한다.

## 배포 빌드

```bash
EOBOM_MOBILE_SERVER_URL=https://<배포 도메인> pnpm sync
pnpm open:ios   # Xcode에서 아카이브
```

`EOBOM_MOBILE_SERVER_URL`을 주지 않으면 `server`를 아예 설정하지 않아 `public/index.html` 안내 페이지가 뜬다. 아무 데도 가리키지 않는 앱이 조용히 빌드되는 것보다 낫다.

> **공개 주소에 http 로 붙으면 `cap sync` 가 실패한다.** 이 환경변수는 그대로 `server.url` 이 되고 http 면 `cleartext` 까지 켜지므로, 실수로 `http://<배포 도메인>` 을 주면 로그인 쿠키가 평문으로 오가는 앱이 빌드된다. http 는 localhost·`.local`·사설 IP 대역(10./192.168./172.16-31./169.254.) 에만 허용된다.

## 연결 실패 화면

원격 로드가 실패하면 `server.errorPath` 로 지정한 `public/offline.html` 이 뜬다(안내 문구 + "다시 시도"). 이게 없으면 WKWebView 기본 에러 화면이 그대로 보인다. 서비스 워커 캐시는 **이미 한 번 설치된 뒤에만** 도움이 되므로 콜드 실패를 막지 못한다.

> 연결이 **거부**되면(포트가 닫혀 있음) 즉시 이 화면이 뜨지만, **드롭**되면(방화벽이 조용히 버림) WKWebView 가 TCP 타임아웃을 기다리는 동안 흰 화면이 유지된다. 실측에서 닿지 않는 LAN IP 는 한참 흰 화면이었고 `localhost` 의 닫힌 포트는 즉시 떴다 — 설정 문제가 아니라 실패 콜백이 늦게 오는 것이다.

## 실측으로 확인한 것 (2026-09-28, iOS 26.5 시뮬레이터)

Decision Log 2026-09-09 의 전제 — **"원격 URL 이면 웹뷰 오리진이 사이트 오리진과 같아 쿠키 인증이 그대로 동작한다"** — 를 실제로 확인했다.

1. 웹뷰가 원격 사이트를 띄운다 (랜딩·로그인 페이지 RSC 렌더)
2. 웹뷰 안에서 API 로 cross-origin 요청이 오간다
3. `document.cookie` 로 심은 `eobom_access` 가 살아남는다
4. 그 상태로 `/dashboard` 로 이동하면 **미들웨어와 RSC 가 쿠키를 읽어** 로그인된 화면을 그린다 (계정 이름이 헤더에 렌더됨)

> **`server.allowNavigation` 이 없으면 여기서 깨진다.** 이것이 빠지면 client-side 네비게이션이 **Safari 로 빠져나가고**, 웹뷰와 Safari 는 쿠키 저장소가 달라 로그인 상태가 통째로 사라진다. 실제로 이 증상을 먼저 만났고(대시보드로 갔더니 Safari 에서 로그인 화면), 호스트를 `allowNavigation` 에 명시해 해결했다. `capacitor.config.ts` 가 `server.url` 의 호스트를 자동으로 넣는다.

## 아직 안 된 것

- **번들 ID가 임시값이다** (`kr.co.eobom.app`). 도메인이 확정되면 `capacitor.config.ts`에서 바꾸고 `npx cap add ios`를 다시 돌려야 한다 — 늦게 바꿀수록 비싸다.
- **푸시 알림 없음.** `@capacitor-firebase/messaging` + `DeviceToken` 테이블 + FCM 발송이 로드맵 항목 4·5다. 이 셸은 그 전 단계다.
- **Android 없음.** 로컬에 Android SDK가 없어 `cap add android`를 돌리지 않았다. Play는 신규 개인 개발자에게 테스터 20명·14일 비공개 테스트를 요구하므로 일정에 미리 넣어야 한다.
- **가로 방향이 열려 있다.** `Info.plist`의 `UISupportedInterfaceOrientations`가 Capacitor 기본값 그대로다. 웹 UI는 하단 탭바 고정의 세로 전용 레이아웃이라 세로로 잠글지 결정이 필요하다.
