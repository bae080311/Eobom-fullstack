import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const mockRotate = vi.fn();
vi.mock('@/entities/organization', () => ({
  useRotateJoinCode: () => ({ mutate: mockRotate, isPending: false }),
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
import { useRotateJoinCodeAction } from './useRotateJoinCodeAction';

describe('useRotateJoinCodeAction', () => {
  beforeEach(() => {
    mockRotate.mockReset();
    mockRefresh.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
  });

  it('openDialog/closeDialog로 open 상태를 토글한다', () => {
    const { result } = renderHook(() => useRotateJoinCodeAction('org1'));

    expect(result.current.open).toBe(false);
    act(() => result.current.openDialog());
    expect(result.current.open).toBe(true);
    act(() => result.current.closeDialog());
    expect(result.current.open).toBe(false);
  });

  it('confirm 호출 시 mutate가 호출된다', () => {
    const { result } = renderHook(() => useRotateJoinCodeAction('org1'));

    act(() => result.current.confirm());
    expect(mockRotate).toHaveBeenCalled();
  });

  it('성공 시 다이얼로그를 닫고 토스트·router.refresh를 실행한다', async () => {
    mockRotate.mockImplementation((_, { onSuccess }) => onSuccess());
    const { result } = renderHook(() => useRotateJoinCodeAction('org1'));

    act(() => result.current.openDialog());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.open).toBe(false));
    expect(mockToastSuccess).toHaveBeenCalledWith('참여 코드가 재발급되었습니다');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('실패 시 다이얼로그를 닫고 서버 에러 메시지를 toast로 보여준다', async () => {
    mockRotate.mockImplementation((_, { onError }) =>
      onError(new ApiError('참여 코드 재발급 권한이 없습니다.', 403)),
    );
    const { result } = renderHook(() => useRotateJoinCodeAction('org1'));

    act(() => result.current.openDialog());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.open).toBe(false));
    expect(mockToastError).toHaveBeenCalledWith('참여 코드 재발급 권한이 없습니다.');
  });
});
