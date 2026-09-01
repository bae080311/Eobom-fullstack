import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgMemberRole, OrgMembershipStatus, type MemberResponseDto } from '@eobom/shared';

const mockDelete = vi.fn();
const mockSetPrimaryTherapist = vi.fn();
vi.mock('@/entities/child', () => ({
  useDeleteChild: () => ({ mutate: mockDelete, isPending: false }),
  useUpdateChild: () => ({ mutate: vi.fn(), isPending: false }),
  useSetPrimaryTherapist: () => ({ mutate: mockSetPrimaryTherapist, isPending: false }),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

const mockToastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: (msg: string) => mockToastSuccess(msg), error: vi.fn() },
}));

import { TherapistChildActions } from './TherapistChildActions';

const baseProps = {
  childId: 'c1',
  name: '홍길동',
  birthDate: null,
  memo: null,
};

const members: MemberResponseDto[] = [
  {
    id: 'm1',
    therapistProfileId: 'tp1',
    role: OrgMemberRole.OWNER,
    status: OrgMembershipStatus.ACTIVE,
    joinedAt: '2026-01-01T00:00:00.000Z',
    user: { id: 'u1', name: '김원장', email: 'owner@eobom.dev' },
  },
  {
    id: 'm2',
    therapistProfileId: 'tp2',
    role: OrgMemberRole.THERAPIST,
    status: OrgMembershipStatus.ACTIVE,
    joinedAt: '2026-01-02T00:00:00.000Z',
    user: { id: 'u2', name: '이치료', email: 'therapist@eobom.dev' },
  },
];

describe('TherapistChildActions', () => {
  beforeEach(() => {
    mockDelete.mockReset();
    mockSetPrimaryTherapist.mockReset();
    mockPush.mockReset();
    mockToastSuccess.mockReset();
  });

  it('수정·삭제 버튼을 보여준다', () => {
    render(<TherapistChildActions {...baseProps} />);
    expect(screen.getByRole('button', { name: /수정/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });

  it('삭제 → 다이얼로그 확인 시 deleteChild.mutate(childId)가 호출된다', async () => {
    const user = userEvent.setup();
    render(<TherapistChildActions {...baseProps} />);

    await user.click(screen.getByRole('button', { name: '삭제' }));
    expect(screen.getByText('아동을 삭제하시겠어요?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '삭제하기' }));

    expect(mockDelete.mock.calls[0][0]).toBe('c1');
  });

  it('삭제 성공 시 /children으로 이동한다', async () => {
    mockDelete.mockImplementation((_, { onSuccess }) => onSuccess());
    const user = userEvent.setup();
    render(<TherapistChildActions {...baseProps} />);

    await user.click(screen.getByRole('button', { name: '삭제' }));
    await user.click(screen.getByRole('button', { name: '삭제하기' }));

    expect(mockToastSuccess).toHaveBeenCalledWith('아동이 삭제되었습니다');
    expect(mockPush).toHaveBeenCalledWith('/children');
  });

  it('수정 버튼 클릭 시 편집 폼이 열린다', async () => {
    const user = userEvent.setup();
    render(<TherapistChildActions {...baseProps} />);

    await user.click(screen.getByRole('button', { name: /수정/ }));
    expect(screen.getByText('아동 정보 수정')).toBeInTheDocument();
  });

  it('기관 멤버가 없으면 담당변경 버튼을 보여주지 않는다', () => {
    render(<TherapistChildActions {...baseProps} members={[]} />);
    expect(screen.queryByRole('button', { name: /담당변경/ })).not.toBeInTheDocument();
  });

  it('담당변경 버튼 클릭 시 멤버 선택 폼이 열리고, 선택 후 제출하면 setPrimaryTherapist.mutate가 호출된다', async () => {
    const user = userEvent.setup();
    render(
      <TherapistChildActions {...baseProps} currentPrimaryTherapistId="tp1" members={members} />,
    );

    await user.click(screen.getByRole('button', { name: /담당변경/ }));
    expect(screen.getByText('담당 치료사 변경')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox'), 'tp2');
    await user.click(screen.getByRole('button', { name: '변경' }));

    expect(mockSetPrimaryTherapist.mock.calls[0][0]).toEqual({
      id: 'c1',
      dto: { primaryTherapistId: 'tp2' },
    });
  });
});
