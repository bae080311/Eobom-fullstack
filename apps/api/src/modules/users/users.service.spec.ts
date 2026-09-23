import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';

vi.mock('argon2', () => ({
  verify: vi.fn(),
  hash: vi.fn(),
}));

import * as argon2 from 'argon2';
import { UsersService } from './users.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

const makeTx = () => ({
  user: { findFirst: vi.fn(), update: vi.fn() },
  organizationMembership: { findMany: vi.fn(), count: vi.fn(), updateMany: vi.fn() },
  therapistProfile: { updateMany: vi.fn() },
  parentProfile: { updateMany: vi.fn() },
  parentChildLink: { deleteMany: vi.fn() },
  notification: { deleteMany: vi.fn() },
});

const makePrisma = () => {
  const txClient = makeTx();
  return {
    txClient,
    user: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    therapistProfile: { upsert: vi.fn() },
    parentProfile: { upsert: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: typeof txClient) => Promise<unknown>) => fn(txClient)),
  };
};

const THERAPIST = {
  id: 'u1',
  role: 'THERAPIST',
  passwordHash: 'hash',
  email: 'a@b.com',
  name: 'Alice',
};
const PARENT = { id: 'p1', role: 'PARENT', passwordHash: 'hash', email: 'p@b.com', name: 'Park' };

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
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

  describe('deleteMe', () => {
    beforeEach(() => {
      vi.mocked(argon2.verify).mockResolvedValue(true);
      vi.mocked(argon2.hash).mockResolvedValue('scrambled');
      prisma.txClient.user.findFirst.mockResolvedValue({ id: 'u1' });
      prisma.txClient.organizationMembership.findMany.mockResolvedValue([]);
      prisma.txClient.organizationMembership.count.mockResolvedValue(0);
    });

    it('throws NotFoundException when the account is already deleted', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.deleteMe('gone', { password: 'pw' })).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException on a wrong password and writes nothing', async () => {
      prisma.user.findFirst.mockResolvedValue(THERAPIST);
      vi.mocked(argon2.verify).mockResolvedValue(false);

      await expect(service.deleteMe('u1', { password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('anonymizes the user and scrambles the password hash', async () => {
      prisma.user.findFirst.mockResolvedValue(THERAPIST);

      await service.deleteMe('u1', { password: 'pw' });

      const call = prisma.txClient.user.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'u1' });
      expect(call.data.deletedAt).toBeInstanceOf(Date);
      expect(call.data.email).toBe('deleted+u1@deleted.eobom.local');
      expect(call.data.name).toBe('탈퇴한 사용자');
      expect(call.data.passwordHash).toBe('scrambled');
      expect(call.data.passwordHash).not.toBe(THERAPIST.passwordHash);
    });

    it('runs every write through the transaction client, not the global prisma', async () => {
      prisma.user.findFirst.mockResolvedValue(THERAPIST);

      await service.deleteMe('u1', { password: 'pw' });

      expect(prisma.txClient.user.update).toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('leaves every active membership and clears the license number for a THERAPIST', async () => {
      prisma.user.findFirst.mockResolvedValue(THERAPIST);

      await service.deleteMe('u1', { password: 'pw' });

      const membershipUpdate = prisma.txClient.organizationMembership.updateMany.mock.calls[0][0];
      expect(membershipUpdate.where).toEqual({
        therapistProfile: { userId: 'u1' },
        status: 'ACTIVE',
      });
      expect(membershipUpdate.data.status).toBe('LEFT');
      expect(membershipUpdate.data.leftAt).toBeInstanceOf(Date);
      expect(prisma.txClient.therapistProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data: { licenseNumber: null },
      });
      expect(prisma.txClient.parentChildLink.deleteMany).not.toHaveBeenCalled();
    });

    it('unlinks children and deletes notifications for a PARENT, keeping the children', async () => {
      prisma.user.findFirst.mockResolvedValue(PARENT);

      await service.deleteMe('p1', { password: 'pw' });

      expect(prisma.txClient.parentChildLink.deleteMany).toHaveBeenCalledWith({
        where: { parent: { userId: 'p1' } },
      });
      expect(prisma.txClient.notification.deleteMany).toHaveBeenCalledWith({
        where: { parent: { userId: 'p1' } },
      });
      expect(prisma.txClient.parentProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: 'p1' },
        data: { phoneNumber: null },
      });
      expect(prisma.txClient.organizationMembership.updateMany).not.toHaveBeenCalled();
    });

    it('blocks deletion when the therapist is the last owner of an org that still has members', async () => {
      prisma.user.findFirst.mockResolvedValue(THERAPIST);
      prisma.txClient.organizationMembership.findMany.mockResolvedValue([{ organizationId: 'o1' }]);
      // 1) 남은 ACTIVE 멤버 2명  2) 남은 ACTIVE OWNER 0명
      prisma.txClient.organizationMembership.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(0);

      await expect(service.deleteMe('u1', { password: 'pw' })).rejects.toThrow(BadRequestException);
      expect(prisma.txClient.user.update).not.toHaveBeenCalled();
    });

    it('allows deletion when another owner remains', async () => {
      prisma.user.findFirst.mockResolvedValue(THERAPIST);
      prisma.txClient.organizationMembership.findMany.mockResolvedValue([{ organizationId: 'o1' }]);
      prisma.txClient.organizationMembership.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      await service.deleteMe('u1', { password: 'pw' });

      expect(prisma.txClient.user.update).toHaveBeenCalled();
    });

    it('allows a solo owner to delete — 1인 기관은 막지 않는다 (Apple 5.1.1(v))', async () => {
      prisma.user.findFirst.mockResolvedValue(THERAPIST);
      prisma.txClient.organizationMembership.findMany.mockResolvedValue([{ organizationId: 'o1' }]);
      // 남은 ACTIVE 멤버 0명이면 소유자 수를 세지도 않고 통과한다
      prisma.txClient.organizationMembership.count.mockResolvedValueOnce(0);

      await service.deleteMe('u1', { password: 'pw' });

      expect(prisma.txClient.organizationMembership.count).toHaveBeenCalledTimes(1);
      expect(prisma.txClient.user.update).toHaveBeenCalled();
    });

    it('bails inside the transaction when the account was deleted concurrently', async () => {
      prisma.user.findFirst.mockResolvedValue(THERAPIST);
      prisma.txClient.user.findFirst.mockResolvedValue(null);

      await expect(service.deleteMe('u1', { password: 'pw' })).rejects.toThrow(NotFoundException);
      expect(prisma.txClient.user.update).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('excludes soft-deleted accounts', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'u1' });
      expect(await service.findById('u1')).toEqual({ id: 'u1' });
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'u1', deletedAt: null },
      });
    });

    it('returns null when not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      expect(await service.findById('missing')).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('excludes soft-deleted accounts', async () => {
      prisma.user.findFirst.mockResolvedValue({ email: 'a@b.com' });
      expect(await service.findByEmail('a@b.com')).toEqual({ email: 'a@b.com' });
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'a@b.com', deletedAt: null },
      });
    });

    it('returns null when not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      expect(await service.findByEmail('missing@b.com')).toBeNull();
    });
  });
});
