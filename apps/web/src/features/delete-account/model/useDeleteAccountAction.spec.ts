import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const mockDeleteAccount = vi.fn();
vi.mock('./useDeleteAccount', () => ({
  useDeleteAccount: () => ({ mutate: mockDeleteAccount, isPending: false }),
}));

const mockClear = vi.fn();
vi.mock('@/features/auth', () => ({
  tokenStorage: { clear: () => mockClear() },
}));

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockToastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: vi.fn(),
  },
}));

import { ApiError } from '@/lib/api';
import { useDeleteAccountAction } from './useDeleteAccountAction';

describe('useDeleteAccountAction', () => {
  beforeEach(() => {
    mockDeleteAccount.mockReset();
    mockClear.mockReset();
    mockReplace.mockReset();
    mockToastSuccess.mockReset();
  });

  it('openDialog는 이전 입력과 에러를 비우고 연다', () => {
    const { result } = renderHook(() => useDeleteAccountAction());

    act(() => result.current.changePassword('이전값'));
    act(() => result.current.openDialog());

    expect(result.current.open).toBe(true);
    expect(result.current.password).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('비밀번호가 비어 있으면 요청을 보내지 않고 에러를 표시한다', () => {
    const { result } = renderHook(() => useDeleteAccountAction());

    act(() => result.current.openDialog());
    act(() => result.current.submit());

    expect(mockDeleteAccount).not.toHaveBeenCalled();
    expect(result.current.error).toBe('비밀번호를 입력해주세요');
  });

  it('성공 시 토큰을 비우고 로그인으로 보낸다', async () => {
    mockDeleteAccount.mockImplementation((_dto, { onSuccess }) => onSuccess());
    const { result } = renderHook(() => useDeleteAccountAction());

    act(() => result.current.openDialog());
    act(() => result.current.changePassword('pw'));
    act(() => result.current.submit());

    await waitFor(() => expect(result.current.open).toBe(false));
    expect(mockDeleteAccount).toHaveBeenCalledWith({ password: 'pw' }, expect.anything());
    expect(mockClear).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith('탈퇴가 완료되었습니다.');
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('실패 시 다이얼로그를 열어 둔 채 서버 메시지를 보여준다', async () => {
    mockDeleteAccount.mockImplementation((_dto, { onError }) =>
      onError(new ApiError('비밀번호가 올바르지 않습니다.', 401)),
    );
    const { result } = renderHook(() => useDeleteAccountAction());

    act(() => result.current.openDialog());
    act(() => result.current.changePassword('wrong'));
    act(() => result.current.submit());

    await waitFor(() => expect(result.current.error).toBe('비밀번호가 올바르지 않습니다.'));
    expect(result.current.open).toBe(true);
    expect(mockClear).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('비밀번호를 다시 입력하면 에러가 사라진다', async () => {
    mockDeleteAccount.mockImplementation((_dto, { onError }) =>
      onError(new ApiError('비밀번호가 올바르지 않습니다.', 401)),
    );
    const { result } = renderHook(() => useDeleteAccountAction());

    act(() => result.current.openDialog());
    act(() => result.current.changePassword('wrong'));
    act(() => result.current.submit());
    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => result.current.changePassword('wrong2'));
    expect(result.current.error).toBeNull();
  });
});
