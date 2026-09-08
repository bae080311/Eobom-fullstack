import { describe, it, expect } from 'vitest';

import { resolveTrustProxy } from './trust-proxy.js';

describe('resolveTrustProxy', () => {
  it('0 이상의 정수는 홉 수로 받는다', () => {
    expect(resolveTrustProxy('0')).toBe(0);
    expect(resolveTrustProxy('1')).toBe(1);
    expect(resolveTrustProxy('3')).toBe(3);
  });

  // Infinity를 넘기면 Express가 XFF 체인 전체를 신뢰해, 클라이언트가 헤더로
  // req.ip를 골라 레이트 리밋 버킷을 갈아탈 수 있다.
  it('Infinity는 거부한다', () => {
    expect(() => resolveTrustProxy('Infinity')).toThrow(/무력화/);
    expect(() => resolveTrustProxy('-Infinity')).toThrow(/무력화/);
  });

  it('소수·음수는 거부한다', () => {
    expect(() => resolveTrustProxy('1.5')).toThrow(/0 이상의 정수/);
    expect(() => resolveTrustProxy('-1')).toThrow(/0 이상의 정수/);
  });

  it('Express 표현식은 그대로 넘긴다', () => {
    expect(resolveTrustProxy('loopback')).toBe('loopback');
    expect(resolveTrustProxy('uniquelocal')).toBe('uniquelocal');
    expect(resolveTrustProxy('10.0.0.0/8')).toBe('10.0.0.0/8');
    expect(resolveTrustProxy('loopback, linklocal')).toBe('loopback, linklocal');
  });
});
