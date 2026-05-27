import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

const makePrisma = () => ({
  user: { findUnique: vi.fn() },
});

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new UsersService(prisma as unknown as PrismaService);
  });

  describe('getMe', () => {
    it('returns user with profiles when found', async () => {
      const user = { id: 'u1', email: 'a@b.com', therapistProfile: null, parentProfile: null };
      prisma.user.findUnique.mockResolvedValue(user);
      const result = await service.getMe('u1');
      expect(result).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
        include: { therapistProfile: true, parentProfile: true },
      });
    });

    it('throws NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getMe('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      expect(await service.findById('u1')).toEqual({ id: 'u1' });
    });

    it('returns null when not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      expect(await service.findById('missing')).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'a@b.com' });
      expect(await service.findByEmail('a@b.com')).toEqual({ email: 'a@b.com' });
    });

    it('returns null when not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      expect(await service.findByEmail('missing@b.com')).toBeNull();
    });
  });
});
