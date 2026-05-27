import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@eobom/shared';
import type { AuthResponseDto } from '@eobom/shared';

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

import { api } from '@/lib/api';
import * as authApi from './authApi';

const mockPost = vi.mocked(api.post);

const mockAuthResponse: AuthResponseDto = {
  accessToken: 'at',
  refreshToken: 'rt',
  user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: UserRole.PARENT },
};

describe('authApi', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('sendVerificationCode posts to /auth/email/send-code', async () => {
    mockPost.mockResolvedValue({ message: 'sent' });
    const result = await authApi.sendVerificationCode({ email: 'a@b.com' });
    expect(mockPost).toHaveBeenCalledWith('/auth/email/send-code', { email: 'a@b.com' });
    expect(result.message).toBe('sent');
  });

  it('verifyCode posts to /auth/email/verify-code', async () => {
    mockPost.mockResolvedValue({ emailVerifiedToken: 'tok' });
    const result = await authApi.verifyCode({ email: 'a@b.com', code: '123456' });
    expect(mockPost).toHaveBeenCalledWith('/auth/email/verify-code', {
      email: 'a@b.com',
      code: '123456',
    });
    expect(result.emailVerifiedToken).toBe('tok');
  });

  it('signup posts to /auth/signup', async () => {
    mockPost.mockResolvedValue(mockAuthResponse);
    const dto = {
      emailVerifiedToken: 'tok',
      password: 'pass12345',
      name: 'Alice',
      role: UserRole.PARENT,
    };
    const result = await authApi.signup(dto);
    expect(mockPost).toHaveBeenCalledWith('/auth/signup', dto);
    expect(result.user.id).toBe('u1');
  });

  it('login posts to /auth/login', async () => {
    mockPost.mockResolvedValue(mockAuthResponse);
    const result = await authApi.login({ email: 'a@b.com', password: 'pass' });
    expect(mockPost).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pass' });
    expect(result.accessToken).toBe('at');
  });

  it('refresh posts to /auth/refresh', async () => {
    mockPost.mockResolvedValue({ accessToken: 'new-at' });
    const result = await authApi.refresh('my-rt');
    expect(mockPost).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'my-rt' });
    expect(result.accessToken).toBe('new-at');
  });

  it('logout posts to /auth/logout', async () => {
    mockPost.mockResolvedValue(undefined);
    await authApi.logout();
    expect(mockPost).toHaveBeenCalledWith('/auth/logout', {});
  });
});
