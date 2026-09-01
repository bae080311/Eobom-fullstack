import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormModal } from './formModal';

describe('FormModal', () => {
  it('open=false면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <FormModal open={false} title="제목" onSubmit={() => {}} onClose={() => {}}>
        내용
      </FormModal>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('open=true면 제목과 children을 렌더링한다', () => {
    render(
      <FormModal open title="아동 정보 수정" onSubmit={() => {}} onClose={() => {}}>
        <input aria-label="이름" />
      </FormModal>,
    );
    expect(screen.getByText('아동 정보 수정')).toBeInTheDocument();
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
  });

  it('폼 제출 시 onSubmit을 호출한다', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <FormModal open title="t" submitLabel="저장" onSubmit={onSubmit} onClose={() => {}}>
        내용
      </FormModal>,
    );
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('취소 버튼 클릭 시 onClose를 호출한다', () => {
    const onClose = vi.fn();
    render(
      <FormModal open title="t" onSubmit={() => {}} onClose={onClose}>
        내용
      </FormModal>,
    );
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('isPending이면 제출 버튼에 pendingLabel을 표시하고 두 버튼 모두 비활성화한다', () => {
    render(
      <FormModal
        open
        title="t"
        isPending
        submitLabel="저장"
        pendingLabel="저장 중..."
        onSubmit={() => {}}
        onClose={() => {}}
      >
        내용
      </FormModal>,
    );
    expect(screen.getByRole('button', { name: '저장 중...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
  });

  it('submitDisabled가 true면 제출 버튼을 비활성화한다', () => {
    render(
      <FormModal
        open
        title="t"
        submitDisabled
        submitLabel="변경"
        onSubmit={() => {}}
        onClose={() => {}}
      >
        내용
      </FormModal>,
    );
    expect(screen.getByRole('button', { name: '변경' })).toBeDisabled();
  });
});
