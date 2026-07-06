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
});
