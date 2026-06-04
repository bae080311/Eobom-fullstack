import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

const makePrisma = () => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
  therapistProfile: { upsert: vi.fn() },
  parentProfile: { upsert: vi.fn() },
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

  describe('updateMe', () => {
    it('updates name and phoneNumber for a PARENT', async () => {
      const existing = { id: 'u1', role: 'PARENT' };
      const updated = {
        id: 'u1',
        name: '새이름',
        parentProfile: { phoneNumber: '01012345678' },
        therapistProfile: null,
      };
      prisma.user.findUnique.mockResolvedValueOnce(existing);
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.updateMe('u1', { name: '새이름', phoneNumber: '01012345678' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {
          name: '새이름',
          parentProfile: {
            upsert: {
              create: { phoneNumber: '01012345678' },
              update: { phoneNumber: '01012345678' },
            },
          },
        },
        include: { therapistProfile: true, parentProfile: true },
      });
      expect(result).toEqual(updated);
    });

    it('updates licenseNumber for a THERAPIST', async () => {
      const existing = { id: 'u2', role: 'THERAPIST' };
      const updated = {
        id: 'u2',
        therapistProfile: { licenseNumber: 'L-1' },
        parentProfile: null,
      };
      prisma.user.findUnique.mockResolvedValueOnce(existing);
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.updateMe('u2', { licenseNumber: 'L-1' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u2' },
        data: {
          therapistProfile: {
            upsert: {
              create: { licenseNumber: 'L-1' },
              update: { licenseNumber: 'L-1' },
            },
          },
        },
        include: { therapistProfile: true, parentProfile: true },
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.updateMe('missing', { name: 'x' })).rejects.toThrow(NotFoundException);
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
