import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrgMemberRole, UserRole } from '@eobom/shared';
import type { IUser } from '@eobom/shared';

import { OrganizationsController } from './organizations.controller.js';
import type { OrganizationsService } from './organizations.service.js';

const makeService = () => ({
  create: vi.fn(),
  findMine: vi.fn(),
  update: vi.fn(),
  rotateJoinCode: vi.fn(),
  findMembers: vi.fn(),
  updateMember: vi.fn(),
  leaveMember: vi.fn(),
});

const user: IUser = {
  id: 'u1',
  email: 't@x.com',
  name: '이치료',
  role: UserRole.THERAPIST,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let service: ReturnType<typeof makeService>;

  beforeEach(() => {
    service = makeService();
    controller = new OrganizationsController(service as unknown as OrganizationsService);
  });

  it('create는 user.id와 dto를 서비스에 전달한다', () => {
    controller.create(user, { name: '이어봄 클리닉' });
    expect(service.create).toHaveBeenCalledWith('u1', { name: '이어봄 클리닉' });
  });

  it('findMine은 user.id를 서비스에 전달한다', () => {
    controller.findMine(user);
    expect(service.findMine).toHaveBeenCalledWith('u1');
  });

  it('update는 user.id·orgId·dto를 서비스에 전달한다', () => {
    controller.update(user, 'org1', { name: '새 이름' });
    expect(service.update).toHaveBeenCalledWith('u1', 'org1', { name: '새 이름' });
  });

  it('rotateJoinCode는 user.id와 orgId를 서비스에 전달한다', () => {
    controller.rotateJoinCode(user, 'org1');
    expect(service.rotateJoinCode).toHaveBeenCalledWith('u1', 'org1');
  });

  it('findMembers는 user.id와 orgId를 서비스에 전달한다', () => {
    controller.findMembers(user, 'org1');
    expect(service.findMembers).toHaveBeenCalledWith('u1', 'org1');
  });

  it('updateMember는 user.id·orgId·membershipId·dto를 서비스에 전달한다', () => {
    controller.updateMember(user, 'org1', 'mem1', { role: OrgMemberRole.OWNER });
    expect(service.updateMember).toHaveBeenCalledWith('u1', 'org1', 'mem1', {
      role: OrgMemberRole.OWNER,
    });
  });

  it('leaveMember는 user.id·orgId·membershipId를 서비스에 전달한다', () => {
    controller.leaveMember(user, 'org1', 'mem1');
    expect(service.leaveMember).toHaveBeenCalledWith('u1', 'org1', 'mem1');
  });
});
