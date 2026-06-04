import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './confirmDialog';

describe('ConfirmDialog', () => {
  it('open=false면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <ConfirmDialog open={false} title="제목" onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('open=true면 제목과 설명을 렌더링한다', () => {
    render(
      <ConfirmDialog
        open
        title="로그아웃 하시겠어요?"
        description="설명입니다"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText('로그아웃 하시겠어요?')).toBeInTheDocument();
    expect(screen.getByText('설명입니다')).toBeInTheDocument();
  });

  it('확인 버튼 클릭 시 onConfirm을 호출한다', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="t"
        confirmLabel="로그아웃"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('취소 버튼 클릭 시 onCancel을 호출한다', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open title="t" cancelLabel="취소" onConfirm={() => {}} onCancel={onCancel} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('loading=true면 확인 버튼이 비활성화된다', () => {
    render(
      <ConfirmDialog
        open
        title="t"
        confirmLabel="확인"
        loading
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
  });
});
