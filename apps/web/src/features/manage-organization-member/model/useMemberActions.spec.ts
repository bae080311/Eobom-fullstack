import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { OrgMemberRole, OrgMembershipStatus, type MemberResponseDto } from '@eobom/shared';

const mockUpdateMember = vi.fn();
const mockLeaveMember = vi.fn();
vi.mock('@/entities/organization', () => ({
  useUpdateMember: () => ({ mutate: mockUpdateMember, isPending: false }),
  useLeaveMember: () => ({ mutate: mockLeaveMember, isPending: false }),
}));

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}));

import { ApiError } from '@/lib/api';
import { useMemberActions } from './useMemberActions';

const therapistMember: MemberResponseDto = {
  id: 'm1',
  therapistProfileId: 'tp1',
  role: OrgMemberRole.THERAPIST,
  status: OrgMembershipStatus.ACTIVE,
  joinedAt: '2026-01-01T00:00:00.000Z',
  user: { id: 'u1', name: '김치료', email: 'therapist@eobom.dev' },
};

const ownerMember: MemberResponseDto = { ...therapistMember, id: 'm2', role: OrgMemberRole.OWNER };

describe('useMemberActions', () => {
  beforeEach(() => {
    mockUpdateMember.mockReset();
    mockLeaveMember.mockReset();
    mockRefresh.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
  });

  it('THERAPIST 멤버에게는 "소유자로 지정" 라벨을 반환한다', () => {
    const { result } = renderHook(() => useMemberActions('org1', therapistMember, false));
    expect(result.current.roleActionLabel).toBe('소유자로 지정');
  });

  it('OWNER 멤버에게는 "치료사로 변경" 라벨을 반환한다', () => {
    const { result } = renderHook(() => useMemberActions('org1', ownerMember, false));
    expect(result.current.roleActionLabel).toBe('치료사로 변경');
  });

  it('본인이면 "탈퇴", 타인이면 "내보내기" 라벨을 반환한다', () => {
    const { result: selfResult } = renderHook(() =>
      useMemberActions('org1', therapistMember, true),
    );
    expect(selfResult.current.leaveActionLabel).toBe('탈퇴');

    const { result: otherResult } = renderHook(() =>
      useMemberActions('org1', therapistMember, false),
    );
    expect(otherResult.current.leaveActionLabel).toBe('내보내기');
  });

  it('confirmRoleChange 호출 시 updateMember.mutate가 호출된다', () => {
    const { result } = renderHook(() => useMemberActions('org1', therapistMember, false));

    act(() => result.current.confirmRoleChange());

    expect(mockUpdateMember).toHaveBeenCalledWith(
      { membershipId: 'm1', dto: { role: OrgMemberRole.OWNER } },
      expect.anything(),
    );
  });

  it('confirmLeave 호출 시 leaveMember.mutate가 호출된다', () => {
    const { result } = renderHook(() => useMemberActions('org1', therapistMember, false));

    act(() => result.current.confirmLeave());

    expect(mockLeaveMember).toHaveBeenCalledWith('m1', expect.anything());
  });

  it('역할 변경 실패 시 다이얼로그를 닫고 서버 에러 메시지를 toast로 보여준다', async () => {
    mockUpdateMember.mockImplementation((_, { onError }) =>
      onError(new ApiError('기관에는 최소 한 명의 소유자가 있어야 합니다.', 400)),
    );
    const { result } = renderHook(() => useMemberActions('org1', ownerMember, false));

    act(() => result.current.openRoleDialog());
    act(() => result.current.confirmRoleChange());

    await waitFor(() => expect(result.current.roleOpen).toBe(false));
    expect(mockToastError).toHaveBeenCalledWith('기관에는 최소 한 명의 소유자가 있어야 합니다.');
  });

  it('탈퇴 성공 시 다이얼로그를 닫고 토스트·router.refresh를 실행한다', async () => {
    mockLeaveMember.mockImplementation((_, { onSuccess }) => onSuccess());
    const { result } = renderHook(() => useMemberActions('org1', therapistMember, true));

    act(() => result.current.openLeaveDialog());
    act(() => result.current.confirmLeave());

    await waitFor(() => expect(result.current.leaveOpen).toBe(false));
    expect(mockToastSuccess).toHaveBeenCalledWith('기관에서 탈퇴했습니다');
    expect(mockRefresh).toHaveBeenCalled();
  });
});
