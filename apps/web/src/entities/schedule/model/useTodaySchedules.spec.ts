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

vi.mock('@/shared/lib/date', () => ({
  getKSTStartOfDay: vi.fn().mockReturnValue(new Date('2026-05-28T15:00:00.000Z')),
  getKSTWeekStart: vi.fn().mockReturnValue(new Date('2026-05-25T15:00:00.000Z')),
  toKSTDateString: vi.fn().mockImplementation((d: Date) => d.toISOString().slice(0, 10)),
}));

import { fetchSchedules } from '../api/index';
import { scheduleKeys } from './useSchedules';
import { useTodaySchedules, useWeekSchedules } from './useTodaySchedules';

const mockFetchSchedules = vi.mocked(fetchSchedules);

const mockSchedule: ScheduleResponseDto = {
  id: 's1',
  childId: 'c1',
  childName: '김아동',
  therapistId: 't1',
  startAt: new Date(2026, 4, 28, 10, 0, 0).toISOString(),
  endAt: new Date(2026, 4, 28, 11, 0, 0).toISOString(),
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

describe('scheduleKeys today/week', () => {
  it('today(dateStr)는 ["schedules", "today", dateStr] 형식이다', () => {
    expect(scheduleKeys.today('2026-05-28')).toEqual(['schedules', 'today', '2026-05-28']);
  });

  it('week(weekStart)는 ["schedules", "week", weekStart] 형식이다', () => {
    expect(scheduleKeys.week('2026-05-26')).toEqual(['schedules', 'week', '2026-05-26']);
  });
});

describe('useTodaySchedules', () => {
  beforeEach(() => {
    mockFetchSchedules.mockReset();
  });

  it('fetchSchedules를 호출하고 데이터를 반환한다', async () => {
    mockFetchSchedules.mockResolvedValue([mockSchedule]);
    const { result } = renderHook(() => useTodaySchedules(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockSchedule]);
    expect(mockFetchSchedules).toHaveBeenCalled();
  });

  it('initialData가 있으면 즉시 데이터를 반환한다', () => {
    const { result } = renderHook(() => useTodaySchedules([mockSchedule]), {
      wrapper: makeWrapper(),
    });
    expect(result.current.data).toEqual([mockSchedule]);
  });

  it('fetchSchedules 실패 시 isError가 true가 된다', async () => {
    mockFetchSchedules.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useTodaySchedules(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useWeekSchedules', () => {
  beforeEach(() => {
    mockFetchSchedules.mockReset();
  });

  it('fetchSchedules를 호출하고 데이터를 반환한다', async () => {
    mockFetchSchedules.mockResolvedValue([mockSchedule]);
    const { result } = renderHook(() => useWeekSchedules(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockSchedule]);
  });

  it('initialData가 있으면 즉시 데이터를 반환한다', () => {
    const { result } = renderHook(() => useWeekSchedules([mockSchedule]), {
      wrapper: makeWrapper(),
    });
    expect(result.current.data).toEqual([mockSchedule]);
  });

  it('fetchSchedules 실패 시 isError가 true가 된다', async () => {
    mockFetchSchedules.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useWeekSchedules(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
