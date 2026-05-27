import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole } from '@eobom/shared';
import { AuthController } from './auth.controller.js';
import type { AuthService } from './auth.service.js';

const makeService = () => ({
  sendVerificationCode: vi.fn(),
  verifyCode: vi.fn(),
  signup: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
});

describe('AuthController', () => {
  let controller: AuthController;
  let service: ReturnType<typeof makeService>;

  beforeEach(() => {
    service = makeService();
    controller = new AuthController(service as unknown as AuthService);
  });

  it('sendVerificationCode delegates to service', async () => {
    service.sendVerificationCode.mockResolvedValue({ message: 'sent' });
    const result = await controller.sendVerificationCode({ email: 'a@b.com' });
    expect(service.sendVerificationCode).toHaveBeenCalledWith({ email: 'a@b.com' });
    expect(result).toEqual({ message: 'sent' });
  });

  it('verifyCode delegates to service', async () => {
    service.verifyCode.mockResolvedValue({ emailVerifiedToken: 'tok' });
    const result = await controller.verifyCode({ email: 'a@b.com', code: '123456' });
    expect(service.verifyCode).toHaveBeenCalledWith({ email: 'a@b.com', code: '123456' });
    expect(result).toEqual({ emailVerifiedToken: 'tok' });
  });

  it('signup delegates to service', async () => {
    const response = {
      accessToken: 'at',
      refreshToken: 'rt',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'PARENT' },
    };
    service.signup.mockResolvedValue(response);
    const dto = {
      emailVerifiedToken: 'tok',
      password: 'pass12345',
      name: 'Alice',
      role: UserRole.PARENT,
    };
    const result = await controller.signup(dto);
    expect(service.signup).toHaveBeenCalledWith(dto);
    expect(result).toEqual(response);
  });

  it('login delegates to service', async () => {
    const response = {
      accessToken: 'at',
      refreshToken: 'rt',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'PARENT' },
    };
    service.login.mockResolvedValue(response);
    const result = await controller.login({ email: 'a@b.com', password: 'pass' });
    expect(result).toEqual(response);
  });

  it('refresh delegates to service', async () => {
    service.refresh.mockResolvedValue({ accessToken: 'new-at' });
    const result = await controller.refresh({ refreshToken: 'rt' });
    expect(result).toEqual({ accessToken: 'new-at' });
  });

  it('logout delegates to service', async () => {
    service.logout.mockResolvedValue(undefined);
    await controller.logout();
    expect(service.logout).toHaveBeenCalledOnce();
  });
});
