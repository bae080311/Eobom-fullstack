import { describe, it, expect } from 'vitest';

import { THROTTLE_POLICIES, resolveThrottleEnabled, ThrottlePolicy } from './throttle.policy.js';
import type { ThrottlePolicyName } from './throttle.policy.js';

const policyNames = Object.keys(THROTTLE_POLICIES) as ThrottlePolicyName[];
const perMinute = (policy: { limit: number; ttl: number }) => policy.limit / (policy.ttl / 60_000);

describe('resolveThrottleEnabled', () => {
  it("문자열 'false'일 때만 끈다", () => {
    expect(resolveThrottleEnabled('false')).toBe(false);
  });

  it('미설정이면 켠다 — 설정을 빠뜨려도 보호가 유지돼야 한다', () => {
    expect(resolveThrottleEnabled(undefined)).toBe(true);
  });

  it("'true'·빈 문자열·오타는 켠 상태로 둔다", () => {
    expect(resolveThrottleEnabled('true')).toBe(true);
    expect(resolveThrottleEnabled('')).toBe(true);
    expect(resolveThrottleEnabled('FALSE')).toBe(true);
    expect(resolveThrottleEnabled('0')).toBe(true);
  });
});

describe('THROTTLE_POLICIES', () => {
  it.each(policyNames)('%s는 limit·ttl이 모두 양수다', (name) => {
    expect(THROTTLE_POLICIES[name].limit).toBeGreaterThan(0);
    expect(THROTTLE_POLICIES[name].ttl).toBeGreaterThan(0);
  });

  // 기본값이 더 느슨해야 라우트별 오버라이드가 의미를 가진다.
  it.each(policyNames.filter((name) => name !== 'default'))(
    '%s는 기본 정책보다 분당 허용량이 낮다',
    (name) => {
      expect(perMinute(THROTTLE_POLICIES[name])).toBeLessThan(perMinute(THROTTLE_POLICIES.default));
    },
  );

  it('OTP·초대코드처럼 코드 자체가 인증 수단인 경로는 10회 이하로 묶는다', () => {
    expect(THROTTLE_POLICIES.verifyEmailCode.limit).toBeLessThanOrEqual(10);
    expect(THROTTLE_POLICIES.redeemInviteCode.limit).toBeLessThanOrEqual(10);
  });
});

describe('ThrottlePolicy', () => {
  it('정책값을 default 키로 감싸 @Throttle 메타데이터를 남긴다', () => {
    class Target {
      @ThrottlePolicy('login')
      handler() {}
    }

    // guard는 이름 없는 throttler를 'default'로 채워 `THROTTLER:LIMITdefault`를 읽는다.
    const handler = Target.prototype.handler;
    expect(Reflect.getMetadata('THROTTLER:LIMITdefault', handler)).toBe(
      THROTTLE_POLICIES.login.limit,
    );
    expect(Reflect.getMetadata('THROTTLER:TTLdefault', handler)).toBe(THROTTLE_POLICIES.login.ttl);
  });
});
