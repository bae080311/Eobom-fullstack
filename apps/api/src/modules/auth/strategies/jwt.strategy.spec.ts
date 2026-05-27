import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';

vi.mock('@nestjs/passport', () => ({
  PassportStrategy: (_Base: new (...args: unknown[]) => unknown) =>
    class {
      constructor(..._args: unknown[]) {}
    },
}));

vi.mock('passport-jwt', () => ({
  ExtractJwt: { fromAuthHeaderAsBearerToken: vi.fn().mockReturnValue(vi.fn()) },
  Strategy: class {},
}));

import type { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const config = { get: vi.fn().mockReturnValue('test-secret') } as unknown as ConfigService;
    strategy = new JwtStrategy(config);
  });

  it('returns IUser from a valid payload', () => {
    const result = strategy.validate({
      sub: 'u1',
      email: 'a@b.com',
      name: 'Alice',
      role: 'THERAPIST',
    });
    expect(result).toMatchObject({ id: 'u1', email: 'a@b.com', name: 'Alice', role: 'THERAPIST' });
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('throws UnauthorizedException when sub is empty', () => {
    expect(() =>
      strategy.validate({ sub: '', email: 'a@b.com', name: 'Alice', role: 'PARENT' }),
    ).toThrow(UnauthorizedException);
  });
});
