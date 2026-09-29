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

/**
 * http 로 붙어도 되는 주소인지 — 로컬 개발용 호스트만 참이다.
 *
 * 루프백·`.local`·사설 IP 대역(RFC 1918)·링크로컬만 통과시킨다.
 */
function isLocalDevHost(hostname: string): boolean {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  )
    return true;
  if (hostname.endsWith(".local") || hostname.endsWith(".localhost"))
    return true;
  return (
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname)
  );
}

/**
 * `EOBOM_MOBILE_SERVER_URL` 을 검증해서 `server` 설정을 만든다.
 *
 * **공개 주소에 http 로 붙는 것을 막는다.** 이 값은 그대로 `server.url` 이 되고
 * http 면 `cleartext` 까지 켜지므로, 실수로 `http://<배포 도메인>` 을 주면 로그인
 * 쿠키가 평문으로 오가는 앱이 조용히 빌드된다. 아동 이름·치료 메모를 다루는
 * 서비스라 그 길을 아예 닫는다 — 잘못된 값이면 `cap sync` 가 실패한다.
 */
function resolveServerConfig(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(
      `EOBOM_MOBILE_SERVER_URL 이 올바른 URL 이 아닙니다: ${rawUrl}`,
    );
  }

  // IPv6 는 URL 문법상 대괄호가 붙어 나온다 (`[::1]`).
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  const cleartext = parsed.protocol === "http:";

  if (cleartext && !isLocalDevHost(hostname)) {
    throw new Error(
      [
        `EOBOM_MOBILE_SERVER_URL 이 http 인데 로컬 주소가 아닙니다: ${rawUrl}`,
        "평문으로 로그인 쿠키가 오가므로 막았습니다.",
        "배포 주소는 https 를 쓰세요. http 는 localhost·LAN(192.168.x.x 등) 개발 주소에만 허용됩니다.",
      ].join("\n"),
    );
  }

  return {
    url: rawUrl,
    // http(로컬 개발)로 띄울 때 필요하다. https 배포 도메인에서는 무시된다.
    cleartext,
    // **이게 없으면 client-side 네비게이션이 Safari로 빠져나간다.** 웹뷰를 벗어나는
    // 순간 쿠키 저장소가 달라져 로그인 상태가 통째로 사라진다(실측 확인, 2026-09-28).
    // Capacitor는 server.url 과 다른 곳으로의 이동을 외부로 판정하는데, 그 판정이
    // 호스트만 보지 않으므로 호스트를 명시해 둔다.
    allowNavigation: [hostname],
    // 원격 로드가 실패했을 때(네트워크 없음·사이트 다운) 띄울 페이지. 설정하지 않으면
    // WKWebView 의 기본 에러 화면이 그대로 보인다. 서비스 워커 캐시는 이미 한 번
    // 설치된 뒤에만 도움이 되므로 콜드 실패를 막지 못한다.
    errorPath: "offline.html",
  };
}

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
  ...(serverUrl ? { server: resolveServerConfig(serverUrl) } : {}),
};

export default config;
