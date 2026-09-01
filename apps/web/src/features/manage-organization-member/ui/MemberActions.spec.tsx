import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgMemberRole, OrgMembershipStatus, type MemberResponseDto } from '@eobom/shared';

const mockOpenRoleDialog = vi.fn();
const mockCloseRoleDialog = vi.fn();
const mockOpenLeaveDialog = vi.fn();
const mockCloseLeaveDialog = vi.fn();
const mockConfirmRoleChange = vi.fn();
const mockConfirmLeave = vi.fn();

function makeHookReturn(overrides?: Partial<ReturnType<typeof baseHookReturn>>) {
  return { ...baseHookReturn(), ...overrides };
}

function baseHookReturn() {
  return {
    isOwner: false,
    roleActionLabel: '소유자로 지정',
    leaveActionLabel: '내보내기',
    roleOpen: false,
    leaveOpen: false,
    isUpdating: false,
    isLeaving: false,
    openRoleDialog: mockOpenRoleDialog,
    closeRoleDialog: mockCloseRoleDialog,
    openLeaveDialog: mockOpenLeaveDialog,
    closeLeaveDialog: mockCloseLeaveDialog,
    confirmRoleChange: mockConfirmRoleChange,
    confirmLeave: mockConfirmLeave,
  };
}

vi.mock('../model/useMemberActions', () => ({
  useMemberActions: vi.fn(),
}));

import { useMemberActions } from '../model/useMemberActions';
import { MemberActions } from './MemberActions';

const mockUseMemberActions = vi.mocked(useMemberActions);

const therapistMember: MemberResponseDto = {
  id: 'm1',
  therapistProfileId: 'tp1',
  role: OrgMemberRole.THERAPIST,
  status: OrgMembershipStatus.ACTIVE,
  joinedAt: '2026-01-01T00:00:00.000Z',
  user: { id: 'u1', name: '김치료', email: 'therapist@eobom.dev' },
};

describe('MemberActions', () => {
  beforeEach(() => {
    mockOpenRoleDialog.mockReset();
    mockCloseRoleDialog.mockReset();
    mockOpenLeaveDialog.mockReset();
    mockCloseLeaveDialog.mockReset();
    mockConfirmRoleChange.mockReset();
    mockConfirmLeave.mockReset();
    mockUseMemberActions.mockReturnValue(makeHookReturn());
  });

  it('훅이 반환한 라벨을 버튼에 표시한다', () => {
    mockUseMemberActions.mockReturnValue(
      makeHookReturn({ roleActionLabel: '치료사로 변경', leaveActionLabel: '탈퇴' }),
    );
    render(<MemberActions orgId="org1" member={therapistMember} isSelf={true} />);

    expect(screen.getByRole('button', { name: '치료사로 변경' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '탈퇴' })).toBeInTheDocument();
  });

  it('역할 버튼 클릭 시 openRoleDialog가 호출된다', async () => {
    const user = userEvent.setup();
    render(<MemberActions orgId="org1" member={therapistMember} isSelf={false} />);

    await user.click(screen.getByRole('button', { name: '소유자로 지정' }));
    expect(mockOpenRoleDialog).toHaveBeenCalled();
  });

  it('내보내기 버튼 클릭 시 openLeaveDialog가 호출된다', async () => {
    const user = userEvent.setup();
    render(<MemberActions orgId="org1" member={therapistMember} isSelf={false} />);

    await user.click(screen.getByRole('button', { name: '내보내기' }));
    expect(mockOpenLeaveDialog).toHaveBeenCalled();
  });

  it('roleOpen이 true면 역할 변경 다이얼로그를 보여주고, 확인 시 confirmRoleChange가 호출된다', async () => {
    mockUseMemberActions.mockReturnValue(makeHookReturn({ roleOpen: true }));
    const user = userEvent.setup();
    render(<MemberActions orgId="org1" member={therapistMember} isSelf={false} />);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('소유자로 지정하시겠어요?')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '소유자로 지정' }));
    expect(mockConfirmRoleChange).toHaveBeenCalled();
  });

  it('leaveOpen이 true면 탈퇴/내보내기 다이얼로그를 보여주고, 확인 시 confirmLeave가 호출된다', async () => {
    mockUseMemberActions.mockReturnValue(makeHookReturn({ leaveOpen: true }));
    const user = userEvent.setup();
    render(<MemberActions orgId="org1" member={therapistMember} isSelf={false} />);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('이 멤버를 내보내시겠어요?')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '내보내기' }));
    expect(mockConfirmLeave).toHaveBeenCalled();
  });
});
