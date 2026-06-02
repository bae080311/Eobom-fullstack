import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { UserWithProfile } from '@/entities/user';

const mockLogout = vi.fn();
vi.mock('@/features/auth', () => ({
  useLogout: () => ({ mutate: mockLogout, isPending: false }),
}));

vi.mock('@/features/edit-profile', () => ({
  EditProfileDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="edit-dialog">edit</div> : null,
}));

import { MyInfoView } from './MyInfoView';

const parentUser: UserWithProfile = {
  id: 'u1',
  name: '이학부모',
  email: 'parent@test.com',
  role: 'PARENT',
  createdAt: '2026-01-15T00:00:00Z',
  therapistProfile: null,
  parentProfile: { phoneNumber: '010-1234-5678' },
};

const therapistUser: UserWithProfile = {
  id: 'u2',
  name: '김치료',
  email: 'ther@test.com',
  role: 'THERAPIST',
  createdAt: '2026-01-15T00:00:00Z',
  therapistProfile: { licenseNumber: 'L-99' },
  parentProfile: null,
};

describe('MyInfoView', () => {
  beforeEach(() => {
    mockLogout.mockReset();
  });

  it('PARENT 계정 정보(이름·이메일·역할·전화번호)를 표시한다', () => {
    render(<MyInfoView user={parentUser} />);
    expect(screen.getByText('이학부모')).toBeInTheDocument();
    expect(screen.getByText('parent@test.com')).toBeInTheDocument();
    expect(screen.getByText('학부모')).toBeInTheDocument();
    expect(screen.getByText('전화번호')).toBeInTheDocument();
    expect(screen.getByText('010-1234-5678')).toBeInTheDocument();
  });

  it('THERAPIST는 역할·면허번호를 표시한다', () => {
    render(<MyInfoView user={therapistUser} />);
    expect(screen.getByText('치료사')).toBeInTheDocument();
    expect(screen.getByText('면허번호')).toBeInTheDocument();
    expect(screen.getByText('L-99')).toBeInTheDocument();
  });

  it('전화번호 미등록 시 "미등록"을 표시한다', () => {
    render(<MyInfoView user={{ ...parentUser, parentProfile: { phoneNumber: null } }} />);
    expect(screen.getByText('미등록')).toBeInTheDocument();
  });

  it('프로필 수정 버튼 클릭 시 편집 다이얼로그가 열린다', () => {
    render(<MyInfoView user={parentUser} />);
    expect(screen.queryByTestId('edit-dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /프로필 수정/ }));
    expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
  });

  it('로그아웃 클릭 시 확인 모달이 뜨고 확인하면 logout을 호출한다', () => {
    render(<MyInfoView user={parentUser} />);
    expect(screen.queryByText('로그아웃 하시겠어요?')).toBeNull();

    // 섹션의 로그아웃 트리거 (이 시점엔 "로그아웃" 버튼이 1개)
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(screen.getByText('로그아웃 하시겠어요?')).toBeInTheDocument();

    // 모달이 열리면 "로그아웃" 버튼이 2개(트리거 + 확인) → 마지막이 확인 버튼
    const logoutButtons = screen.getAllByRole('button', { name: '로그아웃' });
    fireEvent.click(logoutButtons[logoutButtons.length - 1]);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
