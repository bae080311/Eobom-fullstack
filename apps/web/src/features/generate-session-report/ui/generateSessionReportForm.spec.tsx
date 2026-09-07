import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/lib/api';

const mockGenerate = vi.fn();
vi.mock('../model/useGenerateSessionReport', () => ({
  useGenerateSessionReport: () => ({ mutate: mockGenerate, isPending: false }),
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (m: string) => mockToastError(m), success: (m: string) => mockToastSuccess(m) },
}));

import { GenerateSessionReportForm } from './generateSessionReportForm';

const onClose = vi.fn();
const baseProps = { open: true, scheduleId: 's1', initialMemo: '', onClose };

// mutate(memo, { onSuccess, onError }) 의 콜백을 꺼내 쓰기 위한 헬퍼
function lastCallbacks() {
  const [, callbacks] = mockGenerate.mock.calls[mockGenerate.mock.calls.length - 1];
  return callbacks as { onSuccess: () => void; onError: (err: unknown) => void };
}

describe('GenerateSessionReportForm', () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    mockToastError.mockReset();
    mockToastSuccess.mockReset();
    onClose.mockReset();
  });

  it('open이 false면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<GenerateSessionReportForm {...baseProps} open={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('메모가 10자 미만이면 에러를 표시하고 요청하지 않는다', async () => {
    const user = userEvent.setup();
    render(<GenerateSessionReportForm {...baseProps} />);

    await user.type(screen.getByRole('textbox'), '짧음');
    await user.click(screen.getByRole('button', { name: '리포트 만들기' }));

    expect(await screen.findByText('메모를 10자 이상 입력해주세요')).toBeInTheDocument();
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('메모가 유효하면 공백을 다듬어 mutate에 전달한다', async () => {
    const user = userEvent.setup();
    render(<GenerateSessionReportForm {...baseProps} />);

    await user.type(screen.getByRole('textbox'), '  조음 훈련 10분과 문장 따라말하기를 진행했다  ');
    await user.click(screen.getByRole('button', { name: '리포트 만들기' }));

    expect(mockGenerate.mock.calls[0][0]).toBe('조음 훈련 10분과 문장 따라말하기를 진행했다');
  });

  it('성공하면 토스트를 띄우고 폼을 닫는다', async () => {
    const user = userEvent.setup();
    render(<GenerateSessionReportForm {...baseProps} />);

    await user.type(screen.getByRole('textbox'), '조음 훈련 10분과 문장 따라말하기를 진행했다');
    await user.click(screen.getByRole('button', { name: '리포트 만들기' }));
    lastCallbacks().onSuccess();

    expect(mockToastSuccess).toHaveBeenCalledWith('세션 리포트가 작성되었습니다');
    expect(onClose).toHaveBeenCalled();
  });

  it('Ollama 미기동(503)은 재시도 안내 문구로 바꿔 보여준다', async () => {
    const user = userEvent.setup();
    render(<GenerateSessionReportForm {...baseProps} />);

    await user.type(screen.getByRole('textbox'), '조음 훈련 10분과 문장 따라말하기를 진행했다');
    await user.click(screen.getByRole('button', { name: '리포트 만들기' }));
    lastCallbacks().onError(new ApiError('리포트 생성 서비스에 연결할 수 없습니다.', 503));

    expect(mockToastError).toHaveBeenCalledWith(
      '리포트 생성 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요',
    );
  });

  it('503이 아닌 API 에러는 서버 메시지를 그대로 보여준다', async () => {
    const user = userEvent.setup();
    render(<GenerateSessionReportForm {...baseProps} />);

    await user.type(screen.getByRole('textbox'), '조음 훈련 10분과 문장 따라말하기를 진행했다');
    await user.click(screen.getByRole('button', { name: '리포트 만들기' }));
    lastCallbacks().onError(new ApiError('해당 일정의 기관에 소속되어 있지 않습니다.', 403));

    expect(mockToastError).toHaveBeenCalledWith('해당 일정의 기관에 소속되어 있지 않습니다.');
  });

  it('재생성 시 기존 원본 메모를 기본값으로 채운다', () => {
    render(<GenerateSessionReportForm {...baseProps} initialMemo="기존 메모 내용입니다" />);
    expect(screen.getByRole('textbox')).toHaveValue('기존 메모 내용입니다');
  });
});
