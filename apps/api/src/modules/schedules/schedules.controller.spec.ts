import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole } from '@eobom/shared';
import type { IUser } from '@eobom/shared';

import { SchedulesController } from './schedules.controller.js';
import type { SchedulesService } from './schedules.service.js';

const makeService = () => ({
  findAll: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
  acknowledge: vi.fn(),
});

const user: IUser = {
  id: 'u1',
  email: 'p@x.com',
  name: '김부모',
  role: UserRole.PARENT,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

describe('SchedulesController', () => {
  let controller: SchedulesController;
  let service: ReturnType<typeof makeService>;

  beforeEach(() => {
    service = makeService();
    controller = new SchedulesController(service as unknown as SchedulesService);
  });

  it('findAll은 query와 user 전체를 서비스에 전달한다', () => {
    controller.findAll({}, user);
    expect(service.findAll).toHaveBeenCalledWith({}, user);
  });

  it('findOne은 id와 user 전체를 서비스에 전달한다', () => {
    controller.findOne('s1', user);
    expect(service.findOne).toHaveBeenCalledWith('s1', user);
  });

  it('acknowledge는 id와 user 전체를 서비스에 전달한다', () => {
    controller.acknowledge('s1', user);
    expect(service.acknowledge).toHaveBeenCalledWith('s1', user);
  });

  it('confirm은 id와 user.id를 서비스에 전달한다(완료 처리)', () => {
    controller.confirm('s1', user);
    expect(service.confirm).toHaveBeenCalledWith('s1', user.id);
  });
});
