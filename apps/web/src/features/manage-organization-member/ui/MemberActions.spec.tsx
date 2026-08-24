import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgMemberRole, OrgMembershipStatus, type MemberResponseDto } from '@eobom/shared';
import { ApiError } from '@/lib/api';

const mockUpdateMember = vi.fn();
const mockLeaveMember = vi.fn();
vi.mock('@/entities/organization', () => ({
  useUpdateMember: () => ({ mutate: mockUpdateMember, isPending: false }),
  useLeaveMember: () => ({ mutate: mockLeaveMember, isPending: false }),
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

import { MemberActions } from './MemberActions';

const therapistMember: MemberResponseDto = {
  id: 'm1',
  role: OrgMemberRole.THERAPIST,
  status: OrgMembershipStatus.ACTIVE,
  joinedAt: '2026-01-01T00:00:00.000Z',
  user: { id: 'u1', name: '김치료', email: 'therapist@eobom.dev' },
};

const ownerMember: MemberResponseDto = { ...therapistMember, id: 'm2', role: OrgMemberRole.OWNER };

describe('MemberActions', () => {
  beforeEach(() => {
    mockUpdateMember.mockReset();
    mockLeaveMember.mockReset();
    mockRefresh.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
  });

  it('THERAPIST 멤버에게는 "소유자로 지정" 버튼을 보여준다', () => {
    render(<MemberActions orgId="org1" member={therapistMember} isSelf={false} />);
    expect(screen.getByRole('button', { name: '소유자로 지정' })).toBeInTheDocument();
  });

  it('OWNER 멤버에게는 "치료사로 변경" 버튼을 보여준다', () => {
    render(<MemberActions orgId="org1" member={ownerMember} isSelf={false} />);
    expect(screen.getByRole('button', { name: '치료사로 변경' })).toBeInTheDocument();
  });

  it('본인이면 "탈퇴" 버튼을, 타인이면 "내보내기" 버튼을 보여준다', () => {
    const { rerender } = render(
      <MemberActions orgId="org1" member={therapistMember} isSelf={true} />,
    );
    expect(screen.getByRole('button', { name: '탈퇴' })).toBeInTheDocument();

    rerender(<MemberActions orgId="org1" member={therapistMember} isSelf={false} />);
    expect(screen.getByRole('button', { name: '내보내기' })).toBeInTheDocument();
  });

  it('역할 변경 확인 시 updateMember.mutate가 호출된다', async () => {
    const user = userEvent.setup();
    render(<MemberActions orgId="org1" member={therapistMember} isSelf={false} />);

    await user.click(screen.getByRole('button', { name: '소유자로 지정' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '소유자로 지정' }));

    expect(mockUpdateMember).toHaveBeenCalledWith(
      { membershipId: 'm1', dto: { role: OrgMemberRole.OWNER } },
      expect.anything(),
    );
  });

  it('탈퇴/내보내기 확인 시 leaveMember.mutate가 호출된다', async () => {
    const user = userEvent.setup();
    render(<MemberActions orgId="org1" member={therapistMember} isSelf={false} />);

    await user.click(screen.getByRole('button', { name: '내보내기' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '내보내기' }));

    expect(mockLeaveMember).toHaveBeenCalledWith('m1', expect.anything());
  });

  it('실패 시 서버 에러 메시지를 toast로 보여준다', async () => {
    mockUpdateMember.mockImplementation((_, options) =>
      options.onError(new ApiError('기관에는 최소 한 명의 소유자가 있어야 합니다.', 400)),
    );
    const user = userEvent.setup();
    render(<MemberActions orgId="org1" member={ownerMember} isSelf={false} />);

    await user.click(screen.getByRole('button', { name: '치료사로 변경' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '치료사로 변경' }));

    expect(mockToastError).toHaveBeenCalledWith('기관에는 최소 한 명의 소유자가 있어야 합니다.');
  });
});
