import { describe, it, expect } from 'vitest';
import { parseJwt, getJwtRole, isJwtExpired } from './jwt';

function makeToken(payload: Record<string, unknown>): string {
  const body = btoa(JSON.stringify(payload));
  return `header.${body}.signature`;
}

describe('parseJwt', () => {
  it('base64url 페이로드를 객체로 디코딩한다', () => {
    expect(parseJwt(makeToken({ role: 'THERAPIST' }))).toEqual({ role: 'THERAPIST' });
  });

  it('형식이 잘못된 토큰은 null을 반환한다', () => {
    expect(parseJwt('not-a-jwt')).toBeNull();
  });
});

describe('getJwtRole', () => {
  it('role claim을 반환한다', () => {
    expect(getJwtRole(makeToken({ role: 'PARENT' }))).toBe('PARENT');
  });

  it('role claim이 없으면 null을 반환한다', () => {
    expect(getJwtRole(makeToken({}))).toBeNull();
  });

  it('디코딩 실패 시 null을 반환한다', () => {
    expect(getJwtRole('invalid')).toBeNull();
  });
});

describe('isJwtExpired', () => {
  it('exp가 과거면 true를 반환한다', () => {
    expect(isJwtExpired(makeToken({ exp: Math.floor(Date.now() / 1000) - 60 }))).toBe(true);
  });

  it('exp가 미래면 false를 반환한다', () => {
    expect(isJwtExpired(makeToken({ exp: Math.floor(Date.now() / 1000) + 60 }))).toBe(false);
  });

  it('exp claim이 없으면 true(만료로 간주)를 반환한다', () => {
    expect(isJwtExpired(makeToken({}))).toBe(true);
  });

  it('디코딩 실패 시 true(만료로 간주)를 반환한다', () => {
    expect(isJwtExpired('invalid')).toBe(true);
  });
});
