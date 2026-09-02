import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParentRelation } from '@eobom/shared';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockSubmit = vi.fn();
vi.mock('../model/useRedeemInviteCodeAction', () => ({
  useRedeemInviteCodeAction: vi.fn(() => ({ result: null, isPending: false, submit: mockSubmit })),
}));

import { useRedeemInviteCodeAction } from '../model/useRedeemInviteCodeAction';
import { RedeemInviteCodeForm } from './RedeemInviteCodeForm';

const mockUseRedeemInviteCodeAction = vi.mocked(useRedeemInviteCodeAction);

describe('RedeemInviteCodeForm', () => {
  beforeEach(() => {
    mockSubmit.mockReset();
    mockUseRedeemInviteCodeAction.mockReturnValue({
      result: null,
      isPending: false,
      submit: mockSubmit,
    });
  });

  it('코드 없이 제출하면 검증 에러를 보여준다', async () => {
    const user = userEvent.setup();
    render(<RedeemInviteCodeForm />);

    await user.click(screen.getByRole('button', { name: '연결하기' }));

    expect(await screen.findByText('초대 코드를 입력해주세요')).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('코드를 입력하고 제출하면 submit을 호출한다', async () => {
    const user = userEvent.setup();
    render(<RedeemInviteCodeForm />);

    await user.type(screen.getByPlaceholderText('예: A1B2-C3D4'), 'a1b2-c3d4');
    await user.click(screen.getByRole('button', { name: '연결하기' }));

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    const dto = mockSubmit.mock.calls[0][0];
    expect(dto.code).toBe('A1B2-C3D4');
    expect(dto.relation).toBe(ParentRelation.MOTHER);
  });

  it('result가 있으면 결과 화면을 보여준다', () => {
    mockUseRedeemInviteCodeAction.mockReturnValue({
      result: {
        child: { id: 'c1', name: '홍길동' },
        organization: { id: 'org1', name: '이어봄 센터' },
        primaryTherapist: { id: 't1', name: '김치료' },
        relation: ParentRelation.MOTHER,
      },
      isPending: false,
      submit: mockSubmit,
    });

    render(<RedeemInviteCodeForm />);

    expect(screen.getByText('홍길동 아동과 연결되었어요')).toBeInTheDocument();
    expect(screen.getByText(/담당 치료사 김치료/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈으로' })).toHaveAttribute('href', '/home');
  });
});
