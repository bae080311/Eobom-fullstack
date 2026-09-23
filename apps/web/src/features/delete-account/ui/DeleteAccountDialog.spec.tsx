import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteAccountDialog } from './DeleteAccountDialog';

function renderDialog(overrides: Partial<Parameters<typeof DeleteAccountDialog>[0]> = {}) {
  const props = {
    open: true,
    password: '',
    error: null,
    isPending: false,
    isTherapist: false,
    onPasswordChange: vi.fn(),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<DeleteAccountDialog {...props} />);
  return props;
}

describe('DeleteAccountDialog', () => {
  it('open=false면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <DeleteAccountDialog
        open={false}
        password=""
        error={null}
        isPending={false}
        isTherapist={false}
        onPasswordChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('제목을 다이얼로그의 접근성 이름으로 연결한다', () => {
    renderDialog();
    expect(screen.getByRole('dialog', { name: '정말 탈퇴하시겠어요?' })).toBeInTheDocument();
  });

  it('열리면 비밀번호 입력에 포커스를 둔다', () => {
    renderDialog();
    expect(screen.getByLabelText('비밀번호 확인')).toHaveFocus();
  });

  it('Escape를 누르면 onCancel을 호출한다', () => {
    const { onCancel } = renderDialog();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('탈퇴 처리 중에는 Escape로 닫지 않는다', () => {
    const { onCancel } = renderDialog({ isPending: true });
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('치료사에게는 기관 기록 안내를 보여준다', () => {
    renderDialog({ isTherapist: true });
    expect(screen.getByText(/기관 기록으로 남습니다/)).toBeInTheDocument();
  });
});
