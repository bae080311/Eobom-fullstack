import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { InviteCodeType, InviteCodeStatus } from '@eobom/shared';

const mockIssue = vi.fn();
vi.mock('@/entities/invite-code', () => ({
  useIssueParentLinkCode: () => ({ mutate: mockIssue, isPending: false }),
}));

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (msg: string) => mockToastError(msg) },
}));

import { ApiError } from '@/lib/api';
import { useIssueInviteCodeAction } from './useIssueInviteCodeAction';

const issuedCode = {
  id: 'ic1',
  code: 'A1B2-C3D4',
  type: InviteCodeType.PARENT_LINK,
  status: InviteCodeStatus.ACTIVE,
  expiresAt: '2026-06-20T05:00:00.000Z',
  createdAt: '2026-06-20T04:00:00.000Z',
  child: { id: 'c1', name: '홍길동' },
  organization: { id: 'org1', name: '이어봄 센터' },
};

describe('useIssueInviteCodeAction', () => {
  beforeEach(() => {
    mockIssue.mockReset();
    mockRefresh.mockReset();
    mockToastError.mockReset();
  });

  it('issue 호출 시 mutate가 childId와 함께 호출된다', () => {
    const { result } = renderHook(() => useIssueInviteCodeAction('c1'));

    act(() => result.current.issue());
    expect(mockIssue).toHaveBeenCalledWith({ childId: 'c1' }, expect.anything());
  });

  it('성공 시 issued에 발급 코드가 저장되고 router.refresh가 실행된다', async () => {
    mockIssue.mockImplementation((_, { onSuccess }) => onSuccess(issuedCode));
    const { result } = renderHook(() => useIssueInviteCodeAction('c1'));

    act(() => result.current.issue());

    await waitFor(() => expect(result.current.issued).toEqual(issuedCode));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('closeResult 호출 시 issued가 null로 초기화된다', async () => {
    mockIssue.mockImplementation((_, { onSuccess }) => onSuccess(issuedCode));
    const { result } = renderHook(() => useIssueInviteCodeAction('c1'));

    act(() => result.current.issue());
    await waitFor(() => expect(result.current.issued).not.toBeNull());

    act(() => result.current.closeResult());
    expect(result.current.issued).toBeNull();
  });

  it('실패 시 서버 에러 메시지를 toast로 보여준다', async () => {
    mockIssue.mockImplementation((_, { onError }) =>
      onError(new ApiError('아동을 찾을 수 없습니다.', 404)),
    );
    const { result } = renderHook(() => useIssueInviteCodeAction('c1'));

    act(() => result.current.issue());

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('아동을 찾을 수 없습니다.'));
  });
});
