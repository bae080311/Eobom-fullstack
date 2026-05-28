import { describe, it, expect, vi, beforeEach } from 'vitest';
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

import { api } from '@/lib/api';
import { fetchSchedules } from './index';

const mockGet = vi.mocked(api.get);

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

describe('fetchSchedules', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('api.get을 올바른 URL 파라미터로 호출한다', async () => {
    mockGet.mockResolvedValue([mockSchedule]);
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 0, 31);

    await fetchSchedules('test-token', from, to);

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/schedules?from='),
      expect.objectContaining({ token: 'test-token', cache: 'no-store' }),
    );
  });

  it('URL에 from과 to ISO 문자열이 포함된다', async () => {
    mockGet.mockResolvedValue([mockSchedule]);
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 0, 31);

    await fetchSchedules('test-token', from, to);

    const [url] = mockGet.mock.calls[0] as [string, unknown];
    expect(url).toContain(`from=${from.toISOString()}`);
    expect(url).toContain(`to=${to.toISOString()}`);
  });

  it('token을 Authorization 옵션으로 전달한다', async () => {
    mockGet.mockResolvedValue([]);
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 0, 31);

    await fetchSchedules('my-secret-token', from, to);

    const [, opts] = mockGet.mock.calls[0] as [string, { token: string }];
    expect(opts.token).toBe('my-secret-token');
  });

  it('api.get 성공 시 ScheduleResponseDto 배열을 반환한다', async () => {
    mockGet.mockResolvedValue([mockSchedule]);
    const result = await fetchSchedules('test-token', new Date(2024, 0, 1), new Date(2024, 0, 31));
    expect(result).toEqual([mockSchedule]);
  });

  it('api.get이 실패하면 빈 배열을 반환한다', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'));
    const result = await fetchSchedules('test-token', new Date(2024, 0, 1), new Date(2024, 0, 31));
    expect(result).toEqual([]);
  });

  it('api.get이 ApiError를 던져도 빈 배열을 반환한다', async () => {
    const { ApiError } = await import('@/lib/api');
    mockGet.mockRejectedValue(new ApiError('Unauthorized', 401));
    const result = await fetchSchedules('bad-token', new Date(2024, 0, 1), new Date(2024, 0, 31));
    expect(result).toEqual([]);
  });

  it('cache 옵션으로 no-store를 전달한다', async () => {
    mockGet.mockResolvedValue([]);
    await fetchSchedules('test-token', new Date(2024, 0, 1), new Date(2024, 0, 31));
    const [, opts] = mockGet.mock.calls[0] as [string, { cache: string }];
    expect(opts.cache).toBe('no-store');
  });
});
