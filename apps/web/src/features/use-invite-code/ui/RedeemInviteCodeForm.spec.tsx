import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParentRelation } from '@eobom/shared';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

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

import { RedeemInviteCodeForm } from './RedeemInviteCodeForm';

describe('RedeemInviteCodeForm', () => {
  beforeEach(() => {
    mockRedeem.mockReset();
    mockInvalidateQueries.mockReset();
  });

  it('코드 없이 제출하면 검증 에러를 보여준다', async () => {
    const user = userEvent.setup();
    render(<RedeemInviteCodeForm />);

    await user.click(screen.getByRole('button', { name: '연결하기' }));

    expect(await screen.findByText('초대 코드를 입력해주세요')).toBeInTheDocument();
    expect(mockRedeem).not.toHaveBeenCalled();
  });

  it('코드를 입력하고 제출하면 useRedeemInviteCode를 호출한다', async () => {
    const user = userEvent.setup();
    render(<RedeemInviteCodeForm />);

    await user.type(screen.getByPlaceholderText('예: A1B2-C3D4'), 'a1b2-c3d4');
    await user.click(screen.getByRole('button', { name: '연결하기' }));

    expect(mockRedeem).toHaveBeenCalledTimes(1);
    const dto = mockRedeem.mock.calls[0][0];
    expect(dto.code).toBe('A1B2-C3D4');
    expect(dto.relation).toBe(ParentRelation.MOTHER);
  });

  it('성공 시 결과 화면을 보여주고 children 쿼리를 invalidate한다', async () => {
    mockRedeem.mockImplementation((_, { onSuccess }) =>
      onSuccess({
        child: { id: 'c1', name: '홍길동' },
        organization: { id: 'org1', name: '이어봄 센터' },
        primaryTherapist: { id: 't1', name: '김치료' },
        relation: ParentRelation.MOTHER,
      }),
    );
    const user = userEvent.setup();
    render(<RedeemInviteCodeForm />);

    await user.type(screen.getByPlaceholderText('예: A1B2-C3D4'), 'A1B2-C3D4');
    await user.click(screen.getByRole('button', { name: '연결하기' }));

    expect(await screen.findByText('홍길동 아동과 연결되었어요')).toBeInTheDocument();
    expect(screen.getByText(/담당 치료사 김치료/)).toBeInTheDocument();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['children'] }),
    );
  });

  it('실패 시 코드 필드에 서버 에러 메시지를 보여준다', async () => {
    const { ApiError } = await import('@/lib/api');
    mockRedeem.mockImplementation((_, { onError }) =>
      onError(new ApiError('만료된 코드입니다.', 400)),
    );
    const user = userEvent.setup();
    render(<RedeemInviteCodeForm />);

    await user.type(screen.getByPlaceholderText('예: A1B2-C3D4'), 'A1B2-C3D4');
    await user.click(screen.getByRole('button', { name: '연결하기' }));

    expect(await screen.findByText('만료된 코드입니다.')).toBeInTheDocument();
  });
});
