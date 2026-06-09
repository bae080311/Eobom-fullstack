import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public status: number,
    ) {
      super(message);
    }
  },
}));

vi.mock('@/features/auth/model/tokenStorage', () => ({
  tokenStorage: { getAccess: vi.fn().mockReturnValue('test-token') },
}));

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock('@/entities/schedule', () => ({
  scheduleKeys: { all: ['schedules'] },
}));

import { api } from '@/lib/api';
import { scheduleKeys } from '@/entities/schedule';
import { useAcknowledgeSchedule } from './useAcknowledgeSchedule';

const mockPost = vi.mocked(api.post);

const ackResponse = {
  id: 's1',
  childId: 'c1',
  childName: '김아동',
  therapistId: 't1',
  startAt: '2024-01-15T01:00:00.000Z',
  endAt: '2024-01-15T02:00:00.000Z',
  status: 'SCHEDULED',
  title: '언어치료',
  notes: null,
  therapistName: '이치료',
  acknowledged: true,
  acknowledgedAt: '2024-01-15T03:00:00.000Z',
};

describe('useAcknowledgeSchedule', () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockRefresh.mockReset();
  });

  it('POST /schedules/:id/acknowledge를 token과 함께 호출한다', async () => {
    mockPost.mockResolvedValue(ackResponse);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useAcknowledgeSchedule(), { wrapper });
    result.current.mutate('s1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith(
      '/schedules/s1/acknowledge',
      {},
      expect.objectContaining({ token: 'test-token' }),
    );
  });

  it('성공 시 schedules 쿼리를 invalidate하고 router.refresh를 호출한다', async () => {
    mockPost.mockResolvedValue(ackResponse);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useAcknowledgeSchedule(), { wrapper });
    result.current.mutate('s1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: scheduleKeys.all }),
    );
    expect(mockRefresh).toHaveBeenCalled();
  });
});
