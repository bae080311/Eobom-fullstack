import { Throttle } from '@nestjs/throttler';

/**
 * 레이트 리밋 정책값.
 *
 * 환경변수가 아니라 코드 상수로 둔다 — `@Throttle` 데코레이터는 컨트롤러 파일이
 * import될 때 평가되고, 그 시점은 `ConfigModule.forRoot()`가 `.env`를 읽기 전이다
 * (ESM import가 AppModule 클래스 본문보다 먼저 실행된다). 데코레이터 인자에
 * 환경변수를 넣으면 항상 기본값만 읽혀 조용히 무력화된다.
 *
 * 환경별로 실제 필요한 것은 "끄기" 하나뿐이라 그것만 `THROTTLE_ENABLED`로 노출한다.
 *
 * `ttl` 단위는 밀리초다 (@nestjs/throttler v5+).
 *
 * 카운터는 `{컨트롤러}-{핸들러}-{throttler 이름}-{IP}` 키로 쌓인다(guard의 `generateKey`).
 * 즉 리밋은 **라우트마다 따로** 적용된다 — API 전체를 묶는 총량 예산이 아니다.
 */
export const THROTTLE_POLICIES = {
  /**
   * 별도 지정이 없는 모든 라우트에 걸리는 기본값.
   * 라우트 단위라 정상 사용을 막지 않을 만큼 느슨하게 둔다.
   */
  default: { limit: 300, ttl: 60_000 },

  /** 크리덴셜 스터핑 차단. */
  login: { limit: 10, ttl: 300_000 },

  /** 메일 발송 남용 + 가입된 이메일 열거 차단. */
  sendEmailCode: { limit: 5, ttl: 600_000 },

  /** 6자리 OTP 브루트포스 차단 — 리밋이 곧 보안 경계다. */
  verifyEmailCode: { limit: 10, ttl: 600_000 },

  signup: { limit: 5, ttl: 600_000 },

  /** 정상 클라이언트도 토큰 만료마다 호출하므로 로그인보다 넉넉히 둔다. */
  refresh: { limit: 30, ttl: 300_000 },

  /** 초대코드 브루트포스 차단 — 코드 자체가 인증 수단이라 리밋이 곧 보안 경계다. */
  redeemInviteCode: { limit: 10, ttl: 600_000 },
} as const;

export type ThrottlePolicyName = keyof typeof THROTTLE_POLICIES;

/**
 * 라우트별 리밋을 건다. throttler를 이름 없이 등록하면 guard가 `'default'`로
 * 이름을 채우므로, 라우트 오버라이드도 같은 `default` 키에 얹는다.
 */
export const ThrottlePolicy = (name: ThrottlePolicyName) =>
  Throttle({ default: THROTTLE_POLICIES[name] });

/**
 * `ConfigModule.forRoot({ isGlobal: true })`는 타입 변환을 하지 않아 환경변수는 항상 문자열이다.
 * 명시적으로 `'false'`일 때만 끈다 — 미설정이면 켜 두는 쪽이 안전한 기본값이다.
 */
export const resolveThrottleEnabled = (raw: string | undefined): boolean => raw !== 'false';
