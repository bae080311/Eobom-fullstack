import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SessionReportResponseDto } from '@eobom/shared';
import type * as SessionReportEntity from '@/entities/session-report';

// useSessionReport만 대체하고 카드·섹션 컴포넌트는 실제 구현을 그대로 쓴다
// (QueryClientProvider 없이 렌더링하기 위함).
const mockUseSessionReport = vi.fn();
vi.mock('@/entities/session-report', async (importOriginal) => {
  const actual = await importOriginal<typeof SessionReportEntity>();
  return { ...actual, useSessionReport: (...args: unknown[]) => mockUseSessionReport(...args) };
});

const mockGenerate = vi.fn();
vi.mock('../model/useGenerateSessionReport', () => ({
  useGenerateSessionReport: () => ({ mutate: mockGenerate, isPending: false }),
}));

import { TherapistSessionReportSection } from './therapistSessionReportSection';

function makeReport(overrides: Partial<SessionReportResponseDto> = {}): SessionReportResponseDto {
  return {
    id: 'r1',
    scheduleId: 's1',
    rawMemo: '조음 훈련 10분 진행',
    summary: '오늘은 ㄹ 발음 연습을 중심으로 진행했어요',
    activities: ['ㄹ 발음 연습'],
    progress: '초성 정확도가 올라왔어요.',
    homework: null,
    nextGoal: '두 음절 단어 안정화',
    tone: 'positive',
    promptVersion: 'report-v1',
    createdAt: '2026-06-19T05:00:00.000Z',
    updatedAt: '2026-06-19T05:00:00.000Z',
    ...overrides,
  };
}

describe('TherapistSessionReportSection', () => {
  beforeEach(() => {
    mockUseSessionReport.mockReset();
    mockGenerate.mockReset();
  });

  it('리포트가 없으면 빈 상태와 작성 버튼을 보여준다', () => {
    mockUseSessionReport.mockReturnValue({ data: null });
    render(<TherapistSessionReportSection scheduleId="s1" initialReport={null} />);

    expect(screen.getByText('아직 작성된 리포트가 없어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '리포트 작성' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다시 작성' })).not.toBeInTheDocument();
  });

  it('리포트가 없을 때 작성 버튼을 누르면 확인 없이 바로 폼이 열린다', async () => {
    const user = userEvent.setup();
    mockUseSessionReport.mockReturnValue({ data: null });
    render(<TherapistSessionReportSection scheduleId="s1" initialReport={null} />);

    await user.click(screen.getByRole('button', { name: '리포트 작성' }));
    expect(screen.getByText('세션 리포트 작성')).toBeInTheDocument();
  });

  it('리포트가 있으면 카드와 다시 작성 버튼을 보여준다', () => {
    const report = makeReport();
    mockUseSessionReport.mockReturnValue({ data: report });
    render(<TherapistSessionReportSection scheduleId="s1" initialReport={report} />);

    expect(screen.getByText('오늘은 ㄹ 발음 연습을 중심으로 진행했어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 작성' })).toBeInTheDocument();
  });

  it('재생성은 덮어쓰기이므로 확인 다이얼로그를 먼저 띄운다', async () => {
    const user = userEvent.setup();
    const report = makeReport();
    mockUseSessionReport.mockReturnValue({ data: report });
    render(<TherapistSessionReportSection scheduleId="s1" initialReport={report} />);

    await user.click(screen.getByRole('button', { name: '다시 작성' }));
    expect(screen.getByText('리포트를 다시 작성할까요?')).toBeInTheDocument();
    // 확인 전에는 폼이 열리지 않는다
    expect(screen.queryByText('세션 리포트 작성')).not.toBeInTheDocument();
  });

  it('재생성 확인 후 열린 폼에는 기존 원본 메모가 채워져 있다', async () => {
    const user = userEvent.setup();
    const report = makeReport();
    mockUseSessionReport.mockReturnValue({ data: report });
    render(<TherapistSessionReportSection scheduleId="s1" initialReport={report} />);

    await user.click(screen.getByRole('button', { name: '다시 작성' }));
    const dialogButtons = screen.getAllByRole('button', { name: '다시 작성' });
    await user.click(dialogButtons[dialogButtons.length - 1]);

    expect(screen.getByText('세션 리포트 작성')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('조음 훈련 10분 진행');
  });

  it('RSC가 넘긴 initialReport를 useSessionReport에 주입한다', () => {
    const report = makeReport();
    mockUseSessionReport.mockReturnValue({ data: report });
    render(<TherapistSessionReportSection scheduleId="s1" initialReport={report} />);

    expect(mockUseSessionReport).toHaveBeenCalledWith('s1', report);
  });
});
