import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockDelete = vi.fn();
vi.mock('@/entities/child', () => ({
  useDeleteChild: () => ({ mutate: mockDelete, isPending: false }),
  useUpdateChild: () => ({ mutate: vi.fn(), isPending: false }),
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

describe('TherapistChildActions', () => {
  beforeEach(() => {
    mockDelete.mockReset();
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
});
