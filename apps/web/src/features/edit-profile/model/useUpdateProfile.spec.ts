import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { UserWithProfile } from '@/entities/user';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock('@/entities/user', () => ({
  updateMyProfile: vi.fn(),
}));

vi.mock('@/features/auth/model/tokenStorage', () => ({
  tokenStorage: { getAccess: vi.fn().mockReturnValue('test-token') },
}));

import { updateMyProfile } from '@/entities/user';
import { useUpdateProfile } from './useUpdateProfile';

const mockUpdate = vi.mocked(updateMyProfile);

const mockUser: UserWithProfile = {
  id: 'u1',
  name: '새이름',
  email: 'a@b.com',
  role: 'PARENT',
  createdAt: '2026-01-01T00:00:00Z',
  therapistProfile: null,
  parentProfile: { phoneNumber: '010-0000-0000' },
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('useUpdateProfile', () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockRefresh.mockReset();
  });

  it('updateMyProfile를 토큰·dto와 함께 호출한다', async () => {
    mockUpdate.mockResolvedValue(mockUser);
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: makeWrapper() });

    result.current.mutate({ name: '새이름', phoneNumber: '010-0000-0000' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockUpdate).toHaveBeenCalledWith('test-token', {
      name: '새이름',
      phoneNumber: '010-0000-0000',
    });
  });

  it('성공 시 router.refresh를 호출한다', async () => {
    mockUpdate.mockResolvedValue(mockUser);
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: makeWrapper() });

    result.current.mutate({ name: 'x' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
