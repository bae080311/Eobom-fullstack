import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockRotate = vi.fn();
vi.mock('@/entities/organization', () => ({
  useRotateJoinCode: () => ({ mutate: mockRotate, isPending: false }),
}));

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mockToastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: (msg: string) => mockToastSuccess(msg), error: vi.fn() },
}));

import { RotateJoinCodeButton } from './RotateJoinCodeButton';

describe('RotateJoinCodeButton', () => {
  beforeEach(() => {
    mockRotate.mockReset();
    mockRefresh.mockReset();
    mockToastSuccess.mockReset();
  });

  it('클릭 → 확인 다이얼로그에서 확인 시 mutate가 호출된다', async () => {
    const user = userEvent.setup();
    render(<RotateJoinCodeButton orgId="org1" />);

    await user.click(screen.getByRole('button', { name: /재발급/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('참여 코드를 재발급하시겠어요?')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '재발급' }));
    expect(mockRotate).toHaveBeenCalled();
  });

  it('성공 시 토스트를 보여주고 router.refresh를 호출한다', async () => {
    mockRotate.mockImplementation((_, { onSuccess }) => onSuccess());
    const user = userEvent.setup();
    render(<RotateJoinCodeButton orgId="org1" />);

    await user.click(screen.getByRole('button', { name: /재발급/ }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '재발급' }));

    expect(mockToastSuccess).toHaveBeenCalledWith('참여 코드가 재발급되었습니다');
    expect(mockRefresh).toHaveBeenCalled();
  });
});
