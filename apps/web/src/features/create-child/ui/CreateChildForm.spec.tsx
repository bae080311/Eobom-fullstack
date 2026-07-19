import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockCreate = vi.fn();
vi.mock('@/entities/child', () => ({
  useCreateChild: () => ({ mutate: mockCreate, isPending: false }),
}));

const mockToastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: (msg: string) => mockToastSuccess(msg), error: vi.fn() },
}));

import { CreateChildForm } from './CreateChildForm';

const baseProps = { open: true, onClose: vi.fn() };

describe('CreateChildForm', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockToastSuccess.mockReset();
    baseProps.onClose.mockReset();
  });

  it('open이 false면 렌더링하지 않는다', () => {
    render(<CreateChildForm open={false} onClose={vi.fn()} />);
    expect(screen.queryByText('아동 등록')).not.toBeInTheDocument();
  });

  it('이름 없이 제출하면 검증 에러를 보여준다', async () => {
    const user = userEvent.setup();
    render(<CreateChildForm {...baseProps} />);

    await user.click(screen.getByRole('button', { name: '등록' }));

    expect(await screen.findByText('이름을 입력해주세요')).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('이름을 입력하고 제출하면 useCreateChild를 호출한다', async () => {
    const user = userEvent.setup();
    render(<CreateChildForm {...baseProps} />);

    await user.type(screen.getByPlaceholderText('예: 홍길동'), '홍길동');
    await user.click(screen.getByRole('button', { name: '등록' }));

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const dto = mockCreate.mock.calls[0][0];
    expect(dto.name).toBe('홍길동');
    expect(dto.birthDate).toBeUndefined();
    expect(dto.memo).toBeUndefined();
  });

  it('생년월일·메모를 함께 제출할 수 있다', async () => {
    const user = userEvent.setup();
    render(<CreateChildForm {...baseProps} />);

    await user.type(screen.getByPlaceholderText('예: 홍길동'), '홍길동');
    await user.type(screen.getByLabelText('생년월일 (선택)'), '2019-05-10');
    await user.type(screen.getByPlaceholderText('예: 조음 관련 주의'), '받침 발음 연습');
    await user.click(screen.getByRole('button', { name: '등록' }));

    const dto = mockCreate.mock.calls[0][0];
    expect(dto.birthDate).toBe('2019-05-10');
    expect(dto.memo).toBe('받침 발음 연습');
  });

  it('등록 성공 시 toast를 보여주고 닫는다', async () => {
    mockCreate.mockImplementation((_, { onSuccess }) => onSuccess());
    const user = userEvent.setup();
    render(<CreateChildForm {...baseProps} />);

    await user.type(screen.getByPlaceholderText('예: 홍길동'), '홍길동');
    await user.click(screen.getByRole('button', { name: '등록' }));

    expect(mockToastSuccess).toHaveBeenCalledWith('아동이 등록되었습니다');
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });
});
