import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const mockRevoke = vi.fn();
vi.mock('@/entities/invite-code', () => ({
  useRevokeInviteCode: () => ({ mutate: mockRevoke, isPending: false }),
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
import { useRevokeInviteCodeAction } from './useRevokeInviteCodeAction';

describe('useRevokeInviteCodeAction', () => {
  beforeEach(() => {
    mockRevoke.mockReset();
    mockRefresh.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
  });

  it('openDialog/closeDialog로 open 상태를 토글한다', () => {
    const { result } = renderHook(() => useRevokeInviteCodeAction('ic1'));

    expect(result.current.open).toBe(false);
    act(() => result.current.openDialog());
    expect(result.current.open).toBe(true);
    act(() => result.current.closeDialog());
    expect(result.current.open).toBe(false);
  });

  it('confirm 호출 시 mutate가 id와 함께 호출된다', () => {
    const { result } = renderHook(() => useRevokeInviteCodeAction('ic1'));

    act(() => result.current.confirm());
    expect(mockRevoke).toHaveBeenCalledWith('ic1', expect.anything());
  });

  it('성공 시 다이얼로그를 닫고 토스트·router.refresh를 실행한다', async () => {
    mockRevoke.mockImplementation((_, { onSuccess }) => onSuccess());
    const { result } = renderHook(() => useRevokeInviteCodeAction('ic1'));

    act(() => result.current.openDialog());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.open).toBe(false));
    expect(mockToastSuccess).toHaveBeenCalledWith('초대코드가 취소되었습니다');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('실패 시 다이얼로그를 닫고 서버 에러 메시지를 toast로 보여준다', async () => {
    mockRevoke.mockImplementation((_, { onError }) =>
      onError(new ApiError('이미 사용되었거나 취소된 코드입니다.', 409)),
    );
    const { result } = renderHook(() => useRevokeInviteCodeAction('ic1'));

    act(() => result.current.openDialog());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.open).toBe(false));
    expect(mockToastError).toHaveBeenCalledWith('이미 사용되었거나 취소된 코드입니다.');
  });
});
