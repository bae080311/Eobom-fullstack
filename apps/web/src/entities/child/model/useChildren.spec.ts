import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { ChildResponseDto } from '@eobom/shared';

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

import { api } from '@/lib/api';
import { useCreateChild, useUpdateChild, useDeleteChild, childKeys } from './useChildren';

const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockDelete = vi.mocked(api.delete);

const mockChild: ChildResponseDto = {
  id: 'c1',
  name: '도윤',
  birthDate: '2019-03-01T00:00:00.000Z',
  memo: null,
  nextSessionAt: null,
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('childKeys', () => {
  it('all은 ["children"]이다', () => {
    expect(childKeys.all).toEqual(['children']);
  });
});

describe('useCreateChild', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('POST /children을 호출한다', async () => {
    mockPost.mockResolvedValue(mockChild);
    const { result } = renderHook(() => useCreateChild(), { wrapper: makeWrapper() });

    result.current.mutate({ name: '도윤' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith(
      '/children',
      { name: '도윤' },
      expect.objectContaining({ token: 'test-token' }),
    );
  });

  it('성공 시 children 쿼리를 invalidate한다', async () => {
    mockPost.mockResolvedValue(mockChild);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useCreateChild(), { wrapper });
    result.current.mutate({ name: '도윤' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: childKeys.all }),
    );
  });
});

describe('useUpdateChild', () => {
  beforeEach(() => {
    mockPut.mockReset();
  });

  it('PUT /children/:id를 호출한다', async () => {
    mockPut.mockResolvedValue({ ...mockChild, name: '수정된 이름' });
    const { result } = renderHook(() => useUpdateChild(), { wrapper: makeWrapper() });

    result.current.mutate({ id: 'c1', dto: { name: '수정된 이름' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPut).toHaveBeenCalledWith(
      '/children/c1',
      { name: '수정된 이름' },
      expect.objectContaining({ token: 'test-token' }),
    );
  });
});

describe('useDeleteChild', () => {
  beforeEach(() => {
    mockDelete.mockReset();
  });

  it('DELETE /children/:id를 호출한다', async () => {
    mockDelete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteChild(), { wrapper: makeWrapper() });

    result.current.mutate('c1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockDelete).toHaveBeenCalledWith(
      '/children/c1',
      expect.objectContaining({ token: 'test-token' }),
    );
  });

  it('성공 시 children 쿼리를 invalidate한다', async () => {
    mockDelete.mockResolvedValue(undefined);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useDeleteChild(), { wrapper });
    result.current.mutate('c1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: childKeys.all }),
    );
  });
});
