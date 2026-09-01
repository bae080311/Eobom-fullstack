import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { InviteCodeType, InviteCodeStatus, ParentRelation } from '@eobom/shared';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
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
import {
  inviteCodeKeys,
  useIssueParentLinkCode,
  useRevokeInviteCode,
  useRedeemInviteCode,
} from './useInviteCode';

const mockPost = vi.mocked(api.post);
const mockDelete = vi.mocked(api.delete);

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('inviteCodeKeys', () => {
  it('all은 ["invite-codes"]이다', () => {
    expect(inviteCodeKeys.all).toEqual(['invite-codes']);
  });
});

describe('useIssueParentLinkCode', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('POST /invite-codes/parent-link를 호출한다', async () => {
    mockPost.mockResolvedValue({
      id: 'ic1',
      code: 'A1B2-C3D4',
      type: InviteCodeType.PARENT_LINK,
      status: InviteCodeStatus.ACTIVE,
      expiresAt: '2026-06-20T05:00:00.000Z',
      createdAt: '2026-06-20T04:00:00.000Z',
      child: { id: 'c1', name: '홍길동' },
      organization: { id: 'org1', name: '이어봄 센터' },
    });
    const { result } = renderHook(() => useIssueParentLinkCode(), { wrapper: makeWrapper() });

    result.current.mutate({ childId: 'c1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith(
      '/invite-codes/parent-link',
      { childId: 'c1' },
      expect.objectContaining({ token: 'test-token' }),
    );
  });

  it('성공 시 invite-codes 쿼리를 invalidate한다', async () => {
    mockPost.mockResolvedValue({
      id: 'ic1',
      code: 'A1B2-C3D4',
      type: InviteCodeType.PARENT_LINK,
      status: InviteCodeStatus.ACTIVE,
      expiresAt: '2026-06-20T05:00:00.000Z',
      createdAt: '2026-06-20T04:00:00.000Z',
      child: { id: 'c1', name: '홍길동' },
      organization: { id: 'org1', name: '이어봄 센터' },
    });
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useIssueParentLinkCode(), { wrapper });
    result.current.mutate({ childId: 'c1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['invite-codes'] }),
    );
  });
});

describe('useRevokeInviteCode', () => {
  beforeEach(() => {
    mockDelete.mockReset();
  });

  it('DELETE /invite-codes/:id를 호출한다', async () => {
    mockDelete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useRevokeInviteCode(), { wrapper: makeWrapper() });

    result.current.mutate('ic1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockDelete).toHaveBeenCalledWith(
      '/invite-codes/ic1',
      expect.objectContaining({ token: 'test-token' }),
    );
  });
});

describe('useRedeemInviteCode', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('POST /invite-codes/redeem을 호출한다', async () => {
    mockPost.mockResolvedValue({
      child: { id: 'c1', name: '홍길동' },
      organization: { id: 'org1', name: '이어봄 센터' },
      primaryTherapist: { id: 't1', name: '김치료' },
      relation: ParentRelation.MOTHER,
    });
    const { result } = renderHook(() => useRedeemInviteCode(), { wrapper: makeWrapper() });

    result.current.mutate({ code: 'A1B2-C3D4', relation: ParentRelation.MOTHER });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith(
      '/invite-codes/redeem',
      { code: 'A1B2-C3D4', relation: ParentRelation.MOTHER },
      expect.objectContaining({ token: 'test-token' }),
    );
  });
});
