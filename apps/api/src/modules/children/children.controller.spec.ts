import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole } from '@eobom/shared';
import type { IUser } from '@eobom/shared';

import { ChildrenController } from './children.controller.js';
import type { ChildrenService } from './children.service.js';

const makeService = () => ({
  findAll: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  setPrimaryTherapist: vi.fn(),
});

const user: IUser = {
  id: 'u1',
  email: 't@x.com',
  name: '이치료',
  role: UserRole.THERAPIST,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

describe('ChildrenController', () => {
  let controller: ChildrenController;
  let service: ReturnType<typeof makeService>;

  beforeEach(() => {
    service = makeService();
    controller = new ChildrenController(service as unknown as ChildrenService);
  });

  it('findAll은 현재 사용자 객체 전체를 서비스에 전달한다', () => {
    controller.findAll(user);
    expect(service.findAll).toHaveBeenCalledWith(user);
  });

  it('findOne은 id와 사용자 객체를 서비스에 전달한다', () => {
    controller.findOne('c1', user);
    expect(service.findOne).toHaveBeenCalledWith('c1', user);
  });

  it('create는 dto와 userId를 서비스에 전달한다', () => {
    controller.create({ name: '도윤' }, user);
    expect(service.create).toHaveBeenCalledWith({ name: '도윤' }, 'u1');
  });

  it('update는 id·dto·userId를 서비스에 전달한다', () => {
    controller.update('c1', { name: '수정' }, user);
    expect(service.update).toHaveBeenCalledWith('c1', { name: '수정' }, 'u1');
  });

  it('remove는 id와 userId를 서비스에 전달한다', () => {
    controller.remove('c1', user);
    expect(service.remove).toHaveBeenCalledWith('c1', 'u1');
  });

  it('setPrimaryTherapist는 id·dto·userId를 서비스에 전달한다', () => {
    controller.setPrimaryTherapist('c1', { primaryTherapistId: 'tp2' }, user);
    expect(service.setPrimaryTherapist).toHaveBeenCalledWith(
      'c1',
      { primaryTherapistId: 'tp2' },
      'u1',
    );
  });
});
