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
import type { UsersService } from '../../users/users.service.js';
import { JwtStrategy } from './jwt.strategy.js';

const CREATED_AT = new Date('2026-01-02T03:04:05.000Z');
const UPDATED_AT = new Date('2026-02-03T04:05:06.000Z');

const makeRow = () => ({
  id: 'u1',
  email: 'a@b.com',
  name: 'Alice',
  role: 'THERAPIST',
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
});

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let users: { findById: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const config = { get: vi.fn().mockReturnValue('test-secret') } as unknown as ConfigService;
    users = { findById: vi.fn() };
    strategy = new JwtStrategy(config, users as unknown as UsersService);
  });

  it('returns IUser built from the database row, not the payload', async () => {
    users.findById.mockResolvedValue(makeRow());

    const result = await strategy.validate({
      sub: 'u1',
      // 페이로드가 낡았거나 위조돼도 DB 값이 이긴다
      email: 'stale@b.com',
      name: 'Stale Name',
      role: 'PARENT',
    });

    expect(users.findById).toHaveBeenCalledWith('u1');
    expect(result).toEqual({
      id: 'u1',
      email: 'a@b.com',
      name: 'Alice',
      role: 'THERAPIST',
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    });
  });

  it('throws UnauthorizedException when sub is empty', async () => {
    await expect(
      strategy.validate({ sub: '', email: 'a@b.com', name: 'Alice', role: 'PARENT' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(users.findById).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when the account no longer exists (deleted)', async () => {
    // findById가 deletedAt: null을 거르므로 탈퇴 계정은 여기서 null로 돌아온다
    users.findById.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'gone', email: 'a@b.com', name: 'Alice', role: 'THERAPIST' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
