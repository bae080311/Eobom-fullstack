import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { UserRole } from '@eobom/shared';

vi.mock('argon2', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
  verify: vi.fn().mockResolvedValue(true),
}));

import * as argon2 from 'argon2';
import { AuthService } from './auth.service.js';
import type { PrismaService } from '../../database/prisma.service.js';
import type { UsersService } from '../users/users.service.js';
import type { EmailService } from './email.service.js';

const makePrisma = () => ({
  emailVerificationRequest: {
    upsert: vi.fn().mockResolvedValue({}),
    findUnique: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue({}),
  },
  user: {
    create: vi.fn(),
  },
  organization: {
    create: vi.fn().mockResolvedValue({ id: 'org1' }),
    findUnique: vi.fn().mockResolvedValue(null),
  },
  organizationMembership: {
    create: vi.fn().mockResolvedValue({}),
    findFirst: vi.fn().mockResolvedValue(null),
  },
});

const makeUsers = () => ({
  findByEmail: vi.fn().mockResolvedValue(null),
  findById: vi.fn().mockResolvedValue(null),
});

const makeJwt = () => ({
  sign: vi.fn().mockReturnValue('signed-token'),
  verify: vi.fn(),
});

const makeEmail = () => ({
  sendVerificationCode: vi.fn().mockResolvedValue(undefined),
});

const mockUser = (role: string) => ({
  id: 'u1',
  email: 'test@eobom.com',
  name: 'Alice',
  role,
  passwordHash: 'hashed-password',
  emailVerifiedAt: new Date(),
  therapistProfile: role === 'THERAPIST' ? { id: 'tp1' } : null,
  parentProfile: role === 'PARENT' ? { id: 'pp1' } : null,
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  let users: ReturnType<typeof makeUsers>;
  let jwt: ReturnType<typeof makeJwt>;
  let email: ReturnType<typeof makeEmail>;

  beforeEach(() => {
    prisma = makePrisma();
    users = makeUsers();
    jwt = makeJwt();
    email = makeEmail();
    service = new AuthService(
      prisma as unknown as PrismaService,
      users as unknown as UsersService,
      jwt as unknown as JwtService,
      email as unknown as EmailService,
    );
    vi.mocked(argon2.hash).mockResolvedValue('hashed-password');
    vi.mocked(argon2.verify).mockResolvedValue(true);
  });

  describe('sendVerificationCode', () => {
    it('throws ConflictException when email already registered', async () => {
      users.findByEmail.mockResolvedValue({ id: 'u1' });
      await expect(service.sendVerificationCode({ email: 'a@b.com' })).rejects.toThrow(
        ConflictException,
      );
      expect(email.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('upserts a verification request and sends email code', async () => {
      const result = await service.sendVerificationCode({ email: 'new@eobom.com' });
      expect(prisma.emailVerificationRequest.upsert).toHaveBeenCalledOnce();
      expect(email.sendVerificationCode).toHaveBeenCalledWith(
        'new@eobom.com',
        expect.stringMatching(/^\d{6}$/),
      );
      expect(result.message).toBeTruthy();
    });

    it('upsert payload contains a 10-minute expiry window', async () => {
      const before = Date.now();
      await service.sendVerificationCode({ email: 'new@eobom.com' });
      const after = Date.now();
      const { create } = prisma.emailVerificationRequest.upsert.mock.calls[0][0] as {
        create: { expiresAt: Date };
      };
      expect(create.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 9 * 60 * 1000);
      expect(create.expiresAt.getTime()).toBeLessThanOrEqual(after + 11 * 60 * 1000);
    });
  });

  describe('verifyCode', () => {
    const validReq = { email: 'a@b.com', code: '123456', expiresAt: new Date(Date.now() + 60_000) };

    it('returns a signed emailVerifiedToken on success', async () => {
      prisma.emailVerificationRequest.findUnique.mockResolvedValue(validReq);
      const result = await service.verifyCode({ email: 'a@b.com', code: '123456' });
      expect(result.emailVerifiedToken).toBe('signed-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { email: 'a@b.com', verified: true },
        { expiresIn: '15m' },
      );
      expect(prisma.emailVerificationRequest.delete).toHaveBeenCalledOnce();
    });

    it('throws BadRequestException when request not found', async () => {
      prisma.emailVerificationRequest.findUnique.mockResolvedValue(null);
      await expect(service.verifyCode({ email: 'a@b.com', code: '123456' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException on wrong code', async () => {
      prisma.emailVerificationRequest.findUnique.mockResolvedValue({ ...validReq, code: '999999' });
      await expect(service.verifyCode({ email: 'a@b.com', code: '123456' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException on expired code', async () => {
      prisma.emailVerificationRequest.findUnique.mockResolvedValue({
        ...validReq,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.verifyCode({ email: 'a@b.com', code: '123456' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('signup', () => {
    beforeEach(() => {
      jwt.verify.mockReturnValue({ email: 'test@eobom.com', verified: true });
    });

    it('creates PARENT user and returns AuthResponseDto', async () => {
      prisma.user.create.mockResolvedValue(mockUser('PARENT'));
      const result = await service.signup({
        emailVerifiedToken: 'tok',
        password: 'pass12345',
        name: 'Alice',
        role: UserRole.PARENT,
      });
      expect(result.user.role).toBe('PARENT');
      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(argon2.hash).toHaveBeenCalledWith('pass12345');
    });

    it('creates THERAPIST user with CREATE org', async () => {
      prisma.user.create.mockResolvedValue(mockUser('THERAPIST'));
      await service.signup({
        emailVerifiedToken: 'tok',
        password: 'pass12345',
        name: 'Alice',
        role: UserRole.THERAPIST,
        organization: { mode: 'CREATE', name: 'Clinic A' },
      });
      expect(prisma.organization.create).toHaveBeenCalledOnce();
    });

    it('creates THERAPIST user with JOIN org', async () => {
      prisma.user.create.mockResolvedValue(mockUser('THERAPIST'));
      prisma.organization.findUnique.mockResolvedValue({ id: 'org1' });
      await service.signup({
        emailVerifiedToken: 'tok',
        password: 'pass12345',
        name: 'Alice',
        role: UserRole.THERAPIST,
        organization: { mode: 'JOIN', joinCode: 'ABCD1234' },
      });
      expect(prisma.organizationMembership.create).toHaveBeenCalledOnce();
    });

    it('throws NotFoundException when JOIN org code is invalid', async () => {
      prisma.user.create.mockResolvedValue(mockUser('THERAPIST'));
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(
        service.signup({
          emailVerifiedToken: 'tok',
          password: 'pass12345',
          name: 'Alice',
          role: UserRole.THERAPIST,
          organization: { mode: 'JOIN', joinCode: 'INVALID0' },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException if email already registered', async () => {
      users.findByEmail.mockResolvedValue({ id: 'u1' });
      await expect(
        service.signup({
          emailVerifiedToken: 'tok',
          password: 'pass12345',
          name: 'Alice',
          role: UserRole.PARENT,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException on invalid emailVerifiedToken', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('expired');
      });
      await expect(
        service.signup({
          emailVerifiedToken: 'bad',
          password: 'pass12345',
          name: 'Alice',
          role: UserRole.PARENT,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when emailVerifiedToken payload lacks verified flag', async () => {
      jwt.verify.mockReturnValue({ email: 'a@b.com', verified: false });
      await expect(
        service.signup({
          emailVerifiedToken: 'tok',
          password: 'pass12345',
          name: 'Alice',
          role: UserRole.PARENT,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('includes activeOrgMembership in response when membership exists', async () => {
      prisma.user.create.mockResolvedValue(mockUser('THERAPIST'));
      prisma.organizationMembership.findFirst.mockResolvedValue({
        organizationId: 'org1',
        role: 'OWNER',
        organization: { name: 'Clinic A' },
      });
      const result = await service.signup({
        emailVerifiedToken: 'tok',
        password: 'pass12345',
        name: 'Alice',
        role: UserRole.THERAPIST,
      });
      expect(result.activeOrgMembership).toEqual({
        organizationId: 'org1',
        organizationName: 'Clinic A',
        role: 'OWNER',
      });
    });
  });

  describe('login', () => {
    const user = mockUser('PARENT');

    it('returns AuthResponseDto on valid credentials', async () => {
      users.findByEmail.mockResolvedValue(user);
      const result = await service.login({ email: user.email, password: 'pass12345' });
      expect(result.user.id).toBe('u1');
      expect(result.accessToken).toBeDefined();
    });

    it('throws UnauthorizedException when user not found', async () => {
      await expect(service.login({ email: 'ghost@b.com', password: 'pass' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException on wrong password', async () => {
      users.findByEmail.mockResolvedValue(user);
      vi.mocked(argon2.verify).mockResolvedValue(false);
      await expect(service.login({ email: user.email, password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when email not verified', async () => {
      users.findByEmail.mockResolvedValue({ ...user, emailVerifiedAt: null });
      await expect(service.login({ email: user.email, password: 'pass12345' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    const payload = { sub: 'u1', email: 'a@b.com', name: 'Alice', role: 'PARENT' };

    it('returns new accessToken on valid refresh token', async () => {
      jwt.verify.mockReturnValue(payload);
      users.findById.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'Alice',
        role: 'PARENT',
      });
      const result = await service.refresh({ refreshToken: 'valid-rt' });
      expect(result.accessToken).toBe('signed-token');
    });

    it('throws UnauthorizedException on invalid refresh token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid');
      });
      await expect(service.refresh({ refreshToken: 'bad-rt' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user from token no longer exists', async () => {
      jwt.verify.mockReturnValue(payload);
      users.findById.mockResolvedValue(null);
      await expect(service.refresh({ refreshToken: 'valid-rt' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('resolves without error', async () => {
      await expect(service.logout()).resolves.toBeUndefined();
    });
  });
});
