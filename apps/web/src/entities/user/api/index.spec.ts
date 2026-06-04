import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public status: number,
    ) {
      super(message);
    }
  },
}));

import { api } from '@/lib/api';
import { fetchUserMe, updateMyProfile } from './index';
import type { UserWithProfile } from '../model/types';

const mockGet = vi.mocked(api.get);
const mockPatch = vi.mocked(api.patch);

const mockUser: UserWithProfile = {
  id: 'u1',
  name: '김치료',
  email: 'a@b.com',
  role: 'THERAPIST',
  createdAt: '2026-01-01T00:00:00Z',
  therapistProfile: { licenseNumber: 'L-1' },
  parentProfile: null,
};

describe('fetchUserMe', () => {
  // NOTE: 반드시 brace 형태로 작성한다. `() => mockGet.mockReset()` 처럼 mock을
  // 암묵 반환하면 vitest가 그 반환값(함수)을 teardown으로 간주해 테스트 후 mock을
  // 호출하고, reject 설정이 남아 있으면 unhandled rejection으로 실패한다.
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('GET /users/me를 토큰·no-store와 함께 호출한다', async () => {
    mockGet.mockResolvedValue(mockUser);
    await fetchUserMe('test-token');
    expect(mockGet).toHaveBeenCalledWith(
      '/users/me',
      expect.objectContaining({ token: 'test-token', cache: 'no-store' }),
    );
  });

  it('성공 시 user를 반환한다', async () => {
    mockGet.mockResolvedValue(mockUser);
    expect(await fetchUserMe('test-token')).toEqual(mockUser);
  });

  it('실패 시 null을 반환한다', async () => {
    mockGet.mockRejectedValue(new Error('fail'));
    const result = await fetchUserMe('test-token');
    expect(result).toBeNull();
  });
});

describe('updateMyProfile', () => {
  beforeEach(() => {
    mockPatch.mockReset();
  });

  it('PATCH /users/me를 dto·토큰과 함께 호출한다', async () => {
    mockPatch.mockResolvedValue(mockUser);
    await updateMyProfile('test-token', { name: '김치료', licenseNumber: 'L-1' });
    expect(mockPatch).toHaveBeenCalledWith(
      '/users/me',
      { name: '김치료', licenseNumber: 'L-1' },
      expect.objectContaining({ token: 'test-token' }),
    );
  });

  it('수정된 user를 반환한다', async () => {
    mockPatch.mockResolvedValue(mockUser);
    expect(await updateMyProfile('test-token', { name: '김치료' })).toEqual(mockUser);
  });
});
