import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole } from '@eobom/shared';
import type { IUser } from '@eobom/shared';

import { UsersController } from './users.controller.js';
import type { UsersService } from './users.service.js';

const makeService = () => ({
  getMe: vi.fn(),
  updateMe: vi.fn(),
  deleteMe: vi.fn(),
});

const user: IUser = {
  id: 'u1',
  email: 't@x.com',
  name: '이치료',
  role: UserRole.THERAPIST,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: ReturnType<typeof makeService>;

  beforeEach(() => {
    service = makeService();
    controller = new UsersController(service as unknown as UsersService);
  });

  it('getMe는 현재 사용자 id를 서비스에 전달한다', () => {
    controller.getMe(user);
    expect(service.getMe).toHaveBeenCalledWith('u1');
  });

  it('updateMe는 id와 dto를 서비스에 전달한다', () => {
    controller.updateMe(user, { name: '새이름' });
    expect(service.updateMe).toHaveBeenCalledWith('u1', { name: '새이름' });
  });

  it('deleteMe는 경로 파라미터가 아니라 토큰의 id로 삭제한다', () => {
    controller.deleteMe(user, { password: 'pw' });
    expect(service.deleteMe).toHaveBeenCalledWith('u1', { password: 'pw' });
  });
});
