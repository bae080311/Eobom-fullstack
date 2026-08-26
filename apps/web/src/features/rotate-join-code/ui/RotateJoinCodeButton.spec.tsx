import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockOpenDialog = vi.fn();
const mockCloseDialog = vi.fn();
const mockConfirm = vi.fn();
vi.mock('../model/useRotateJoinCodeAction', () => ({
  useRotateJoinCodeAction: vi.fn(() => ({
    open: false,
    isPending: false,
    openDialog: mockOpenDialog,
    closeDialog: mockCloseDialog,
    confirm: mockConfirm,
  })),
}));

import { useRotateJoinCodeAction } from '../model/useRotateJoinCodeAction';
import { RotateJoinCodeButton } from './RotateJoinCodeButton';

const mockUseRotateJoinCodeAction = vi.mocked(useRotateJoinCodeAction);

describe('RotateJoinCodeButton', () => {
  beforeEach(() => {
    mockOpenDialog.mockReset();
    mockCloseDialog.mockReset();
    mockConfirm.mockReset();
    mockUseRotateJoinCodeAction.mockReturnValue({
      open: false,
      isPending: false,
      openDialog: mockOpenDialog,
      closeDialog: mockCloseDialog,
      confirm: mockConfirm,
    });
  });

  it('재발급 버튼 클릭 시 openDialog가 호출된다', async () => {
    const user = userEvent.setup();
    render(<RotateJoinCodeButton orgId="org1" />);

    await user.click(screen.getByRole('button', { name: /재발급/ }));
    expect(mockOpenDialog).toHaveBeenCalled();
  });

  it('open이 true면 확인 다이얼로그를 보여주고, 확인 클릭 시 confirm이 호출된다', async () => {
    mockUseRotateJoinCodeAction.mockReturnValue({
      open: true,
      isPending: false,
      openDialog: mockOpenDialog,
      closeDialog: mockCloseDialog,
      confirm: mockConfirm,
    });
    const user = userEvent.setup();
    render(<RotateJoinCodeButton orgId="org1" />);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('참여 코드를 재발급하시겠어요?')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '재발급' }));
    expect(mockConfirm).toHaveBeenCalled();
  });

  it('다이얼로그 취소 클릭 시 closeDialog가 호출된다', async () => {
    mockUseRotateJoinCodeAction.mockReturnValue({
      open: true,
      isPending: false,
      openDialog: mockOpenDialog,
      closeDialog: mockCloseDialog,
      confirm: mockConfirm,
    });
    const user = userEvent.setup();
    render(<RotateJoinCodeButton orgId="org1" />);

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(mockCloseDialog).toHaveBeenCalled();
  });
});
