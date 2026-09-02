import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ParentRelation } from '@eobom/shared';

const mockRedeem = vi.fn();
vi.mock('@/entities/invite-code', () => ({
  useRedeemInviteCode: () => ({ mutate: mockRedeem, isPending: false }),
}));

vi.mock('@/entities/child', () => ({
  childKeys: { all: ['children'] },
}));

const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (msg: string) => mockToastError(msg) },
}));

import { ApiError } from '@/lib/api';
import { useRedeemInviteCodeAction } from './useRedeemInviteCodeAction';

const redeemResult = {
  child: { id: 'c1', name: '홍길동' },
  organization: { id: 'org1', name: '이어봄 센터' },
  primaryTherapist: { id: 't1', name: '김치료' },
  relation: ParentRelation.MOTHER,
};

describe('useRedeemInviteCodeAction', () => {
  beforeEach(() => {
    mockRedeem.mockReset();
    mockInvalidateQueries.mockReset();
    mockToastError.mockReset();
  });

  it('submit 호출 시 mutate가 dto와 함께 호출된다', () => {
    const { result } = renderHook(() => useRedeemInviteCodeAction());

    act(() => result.current.submit({ code: 'A1B2-C3D4', relation: ParentRelation.MOTHER }));
    expect(mockRedeem).toHaveBeenCalledWith(
      { code: 'A1B2-C3D4', relation: ParentRelation.MOTHER },
      expect.anything(),
    );
  });

  it('성공 시 result가 채워지고 children 쿼리를 invalidate한다', async () => {
    mockRedeem.mockImplementation((_, { onSuccess }) => onSuccess(redeemResult));
    const { result } = renderHook(() => useRedeemInviteCodeAction());

    act(() => result.current.submit({ code: 'A1B2-C3D4', relation: ParentRelation.MOTHER }));

    await waitFor(() => expect(result.current.result).toEqual(redeemResult));
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['children'] }),
    );
  });

  it('실패 시 서버 에러 메시지를 toast로 보여준다', async () => {
    mockRedeem.mockImplementation((_, { onError }) =>
      onError(new ApiError('만료된 코드입니다.', 400)),
    );
    const { result } = renderHook(() => useRedeemInviteCodeAction());

    act(() => result.current.submit({ code: 'A1B2-C3D4', relation: ParentRelation.MOTHER }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('만료된 코드입니다.'));
  });
});
