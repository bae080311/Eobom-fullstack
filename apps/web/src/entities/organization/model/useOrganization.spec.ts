import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { OrgMemberRole, OrgMembershipStatus, type MemberResponseDto } from '@eobom/shared';

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
  organizationKeys,
  useUpdateOrganization,
  useRotateJoinCode,
  useUpdateMember,
  useLeaveMember,
} from './useOrganization';

const mockPatch = vi.mocked(api.patch);
const mockPost = vi.mocked(api.post);

const mockMember: MemberResponseDto = {
  id: 'm1',
  therapistProfileId: 'tp1',
  role: OrgMemberRole.THERAPIST,
  status: OrgMembershipStatus.ACTIVE,
  joinedAt: '2026-01-01T00:00:00.000Z',
  user: { id: 'u1', name: '김치료', email: 'therapist@eobom.dev' },
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('organizationKeys', () => {
  it('all은 ["organization"]이다', () => {
    expect(organizationKeys.all).toEqual(['organization']);
  });

  it('members(orgId)는 ["organization", orgId, "members"]이다', () => {
    expect(organizationKeys.members('org1')).toEqual(['organization', 'org1', 'members']);
  });
});

describe('useUpdateOrganization', () => {
  beforeEach(() => {
    mockPatch.mockReset();
  });

  it('PATCH /organizations/:orgId를 호출한다', async () => {
    mockPatch.mockResolvedValue({
      id: 'org1',
      name: '새 이름',
      joinCode: 'ABC123',
      membership: { id: 'm0', role: OrgMemberRole.OWNER },
    });
    const { result } = renderHook(() => useUpdateOrganization('org1'), { wrapper: makeWrapper() });

    result.current.mutate({ name: '새 이름' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPatch).toHaveBeenCalledWith(
      '/organizations/org1',
      { name: '새 이름' },
      expect.objectContaining({ token: 'test-token' }),
    );
  });
});

describe('useRotateJoinCode', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('POST /organizations/:orgId/join-code:rotate를 호출한다', async () => {
    mockPost.mockResolvedValue({ joinCode: 'NEWCODE', rotatedAt: '2026-08-24T00:00:00.000Z' });
    const { result } = renderHook(() => useRotateJoinCode('org1'), { wrapper: makeWrapper() });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith(
      '/organizations/org1/join-code:rotate',
      undefined,
      expect.objectContaining({ token: 'test-token' }),
    );
  });

  it('성공 시 organization 쿼리를 invalidate한다', async () => {
    mockPost.mockResolvedValue({ joinCode: 'NEWCODE', rotatedAt: '2026-08-24T00:00:00.000Z' });
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useRotateJoinCode('org1'), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: organizationKeys.all }),
    );
  });
});

describe('useUpdateMember', () => {
  beforeEach(() => {
    mockPatch.mockReset();
  });

  it('PATCH /organizations/:orgId/members/:membershipId를 호출한다', async () => {
    mockPatch.mockResolvedValue({ ...mockMember, role: OrgMemberRole.OWNER });
    const { result } = renderHook(() => useUpdateMember('org1'), { wrapper: makeWrapper() });

    result.current.mutate({ membershipId: 'm1', dto: { role: OrgMemberRole.OWNER } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPatch).toHaveBeenCalledWith(
      '/organizations/org1/members/m1',
      { role: OrgMemberRole.OWNER },
      expect.objectContaining({ token: 'test-token' }),
    );
  });

  it('성공 시 members 쿼리를 invalidate한다', async () => {
    mockPatch.mockResolvedValue({ ...mockMember, role: OrgMemberRole.OWNER });
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useUpdateMember('org1'), { wrapper });
    result.current.mutate({ membershipId: 'm1', dto: { role: OrgMemberRole.OWNER } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: organizationKeys.members('org1') }),
    );
  });
});

describe('useLeaveMember', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('POST /organizations/:orgId/members/:membershipId:leave를 호출한다', async () => {
    mockPost.mockResolvedValue(undefined);
    const { result } = renderHook(() => useLeaveMember('org1'), { wrapper: makeWrapper() });

    result.current.mutate('m1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith(
      '/organizations/org1/members/m1:leave',
      undefined,
      expect.objectContaining({ token: 'test-token' }),
    );
  });
});
