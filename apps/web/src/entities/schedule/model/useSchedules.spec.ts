import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ScheduleStatus } from '@eobom/shared';
import type { ScheduleResponseDto } from '@eobom/shared';

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

vi.mock('../api/index', () => ({
  fetchSchedules: vi.fn(),
}));

import { api } from '@/lib/api';
import { fetchSchedules } from '../api/index';
import {
  useSchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useCancelSchedule,
  useConfirmSchedule,
  scheduleKeys,
} from './useSchedules';

const mockFetchSchedules = vi.mocked(fetchSchedules);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockDelete = vi.mocked(api.delete);

const mockSchedule: ScheduleResponseDto = {
  id: 's1',
  childId: 'c1',
  childName: '김아동',
  therapistId: 't1',
  startAt: new Date(2024, 0, 15, 10, 0, 0).toISOString(),
  endAt: new Date(2024, 0, 15, 11, 0, 0).toISOString(),
  status: ScheduleStatus.SCHEDULED,
  title: '언어치료',
  notes: null,
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('scheduleKeys', () => {
  it('all은 ["schedules"]이다', () => {
    expect(scheduleKeys.all).toEqual(['schedules']);
  });

  it('month(2024, 0)은 ["schedules", 2024, 0]이다', () => {
    expect(scheduleKeys.month(2024, 0)).toEqual(['schedules', 2024, 0]);
  });
});

describe('useSchedules', () => {
  beforeEach(() => {
    mockFetchSchedules.mockReset();
  });

  it('queryKey로 scheduleKeys.month(year, month)를 사용한다', async () => {
    mockFetchSchedules.mockResolvedValue([mockSchedule]);
    const { result } = renderHook(() => useSchedules(2024, 0), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockSchedule]);
  });

  it('fetchSchedules를 호출한다', async () => {
    mockFetchSchedules.mockResolvedValue([mockSchedule]);
    renderHook(() => useSchedules(2024, 0), { wrapper: makeWrapper() });
    await waitFor(() => expect(mockFetchSchedules).toHaveBeenCalled());
  });

  it('initialData가 제공되면 즉시 데이터를 반환한다', () => {
    const { result } = renderHook(() => useSchedules(2024, 0, [mockSchedule]), {
      wrapper: makeWrapper(),
    });
    expect(result.current.data).toEqual([mockSchedule]);
  });

  it('fetchSchedules 실패 시 isError가 true가 된다', async () => {
    mockFetchSchedules.mockRejectedValue(new Error('fetch failed'));
    const { result } = renderHook(() => useSchedules(2024, 0), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateSchedule', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('POST /schedules를 호출한다', async () => {
    mockPost.mockResolvedValue(mockSchedule);
    const { result } = renderHook(() => useCreateSchedule(), {
      wrapper: makeWrapper(),
    });

    const dto = {
      childId: 'c1',
      startAt: mockSchedule.startAt,
      endAt: mockSchedule.endAt,
      title: '언어치료',
    };

    result.current.mutate(dto);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith(
      '/schedules',
      dto,
      expect.objectContaining({ token: 'test-token' }),
    );
  });

  it('성공 시 schedules 쿼리를 invalidate한다', async () => {
    mockPost.mockResolvedValue(mockSchedule);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useCreateSchedule(), { wrapper });
    result.current.mutate({
      childId: 'c1',
      startAt: mockSchedule.startAt,
      endAt: mockSchedule.endAt,
      title: '테스트',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: scheduleKeys.all }),
    );
  });
});

describe('useUpdateSchedule', () => {
  beforeEach(() => {
    mockPut.mockReset();
  });

  it('PUT /schedules/:id를 호출한다', async () => {
    mockPut.mockResolvedValue({ ...mockSchedule, title: '수정된 치료' });
    const { result } = renderHook(() => useUpdateSchedule(), {
      wrapper: makeWrapper(),
    });

    result.current.mutate({ id: 's1', dto: { title: '수정된 치료' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPut).toHaveBeenCalledWith(
      '/schedules/s1',
      { title: '수정된 치료' },
      expect.objectContaining({ token: 'test-token' }),
    );
  });

  it('성공 시 schedules 쿼리를 invalidate한다', async () => {
    mockPut.mockResolvedValue(mockSchedule);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useUpdateSchedule(), { wrapper });
    result.current.mutate({ id: 's1', dto: { title: '변경' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: scheduleKeys.all }),
    );
  });
});

describe('useCancelSchedule', () => {
  beforeEach(() => {
    mockDelete.mockReset();
  });

  it('DELETE /schedules/:id를 호출한다', async () => {
    mockDelete.mockResolvedValue({ ...mockSchedule, status: ScheduleStatus.CANCELED });
    const { result } = renderHook(() => useCancelSchedule(), {
      wrapper: makeWrapper(),
    });

    result.current.mutate('s1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockDelete).toHaveBeenCalledWith(
      '/schedules/s1',
      expect.objectContaining({ token: 'test-token' }),
    );
  });

  it('성공 시 schedules 쿼리를 invalidate한다', async () => {
    mockDelete.mockResolvedValue(mockSchedule);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useCancelSchedule(), { wrapper });
    result.current.mutate('s1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: scheduleKeys.all }),
    );
  });
});

describe('useConfirmSchedule', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('POST /schedules/:id/confirm를 호출한다', async () => {
    mockPost.mockResolvedValue({ ...mockSchedule, status: ScheduleStatus.COMPLETED });
    const { result } = renderHook(() => useConfirmSchedule(), {
      wrapper: makeWrapper(),
    });

    result.current.mutate('s1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith(
      '/schedules/s1/confirm',
      {},
      expect.objectContaining({ token: 'test-token' }),
    );
  });

  it('성공 시 schedules 쿼리를 invalidate한다', async () => {
    mockPost.mockResolvedValue(mockSchedule);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useConfirmSchedule(), { wrapper });
    result.current.mutate('s1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: scheduleKeys.all }),
    );
  });
});
