import type { CapacitorConfig } from "@capacitor/cli";

/**
 * 이어봄 네이티브 셸.
 *
 * `apps/web`을 번들로 동봉하지 않고 **배포된 사이트를 원격 URL로 가리킨다**
 * (레이어 8 §8.7, Decision Log 2026-09-09). 웹은 서버 렌더링이고 RSC에서
 * `cookies()`로 `eobom_access`를 읽는 페이지가 14개라, 정적 번들로 바꾸려면
 * 웹 앱을 전면 재작성해야 한다. 원격 URL이면 웹뷰 오리진이 사이트 오리진과
 * 같으므로 쿠키 인증이 그대로 동작한다.
 *
 * `EOBOM_MOBILE_SERVER_URL`로 가리킬 곳을 정한다. `cap sync` 시점에 네이티브
 * 프로젝트로 구워지므로, 값을 바꾸면 sync를 다시 해야 한다.
 *
 *   로컬 개발: EOBOM_MOBILE_SERVER_URL=http://localhost:3000 pnpm sync
 *              (iOS 시뮬레이터는 호스트와 네트워크 스택을 공유해 localhost가 그대로 닿는다.
 *               실기기는 맥의 LAN IP를 쓴다.)
 *   배포:      EOBOM_MOBILE_SERVER_URL=https://<배포 도메인> pnpm sync
 *
 * 값을 주지 않으면 `server`를 아예 설정하지 않아 `webDir`의 폴백 페이지가 뜬다 —
 * 실수로 아무 데도 가리키지 않는 앱이 빌드되는 것보다 낫다.
 */
const serverUrl = process.env.EOBOM_MOBILE_SERVER_URL;

const config: CapacitorConfig = {
  // TODO(스토어 제출 전): 번들 ID를 확정한다. 확정 도메인이 정해지면
  // `kr.co.<도메인>.eobom` 형태로 바꾸고 `npx cap add ios`를 다시 돌린다.
  appId: "kr.co.eobom.app",
  appName: "이어봄",
  webDir: "public",
  ios: {
    // 웹뷰가 콘텐츠를 노치·홈 인디케이터 밑까지 그리게 둔다. 실제 여백은
    // 웹의 `env(safe-area-inset-*)`가 처리한다 (globals.css 주석 참고).
    contentInset: "never",
  },
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          // http(로컬 개발)로 띄울 때 필요하다. https 배포 도메인에서는 무시된다.
          cleartext: serverUrl.startsWith("http://"),
          // **이게 없으면 client-side 네비게이션이 Safari로 빠져나간다.** 웹뷰를 벗어나는
          // 순간 쿠키 저장소가 달라져 로그인 상태가 통째로 사라진다(실측 확인, 2026-09-28).
          // Capacitor는 server.url 과 다른 곳으로의 이동을 외부로 판정하는데, 그 판정이
          // 호스트만 보지 않으므로 호스트를 명시해 둔다.
          allowNavigation: [new URL(serverUrl).hostname],
        },
      }
    : {}),
};

export default config;
