import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockMutate = vi.fn();
vi.mock('../model/useAcknowledgeSchedule', () => ({
  useAcknowledgeSchedule: vi.fn(() => ({ mutate: mockMutate, isPending: false })),
}));

import { ParentScheduleFooter } from './parentScheduleFooter';

describe('ParentScheduleFooter', () => {
  beforeEach(() => {
    mockMutate.mockReset();
  });

  describe('미확인 상태', () => {
    it('"변경 요청" 버튼은 비활성 placeholder다', () => {
      render(
        <ParentScheduleFooter
          scheduleId="s1"
          initialAcknowledged={false}
          initialAcknowledgedAt={null}
        />,
      );
      expect(screen.getByRole('button', { name: '변경 요청' })).toBeDisabled();
    });

    it('"일정 확인" 버튼을 클릭하면 확인 다이얼로그가 열린다', async () => {
      const user = userEvent.setup();
      render(
        <ParentScheduleFooter
          scheduleId="s1"
          initialAcknowledged={false}
          initialAcknowledgedAt={null}
        />,
      );

      expect(screen.queryByText('일정을 확인하시겠어요?')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: '일정 확인' }));
      expect(screen.getByText('일정을 확인하시겠어요?')).toBeInTheDocument();
    });

    it('다이얼로그에서 확인하면 mutate(scheduleId)가 호출된다', async () => {
      const user = userEvent.setup();
      render(
        <ParentScheduleFooter
          scheduleId="s1"
          initialAcknowledged={false}
          initialAcknowledgedAt={null}
        />,
      );

      await user.click(screen.getByRole('button', { name: '일정 확인' }));
      await user.click(screen.getByRole('button', { name: '확인' }));

      expect(mockMutate.mock.calls[0][0]).toBe('s1');
    });
  });

  describe('확인 완료 상태', () => {
    it('"확인 완료"와 확인 시각을 표시하고 다이얼로그를 열지 않는다', async () => {
      const user = userEvent.setup();
      render(
        <ParentScheduleFooter
          scheduleId="s1"
          initialAcknowledged
          initialAcknowledgedAt="2024-01-15T01:00:00.000Z"
        />,
      );

      const doneButton = screen.getByText(/확인 완료/);
      expect(doneButton).toBeInTheDocument();
      // KST 10:00 (UTC 01:00)
      expect(screen.getByText(/1월 15일/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '일정 확인' })).not.toBeInTheDocument();

      await user.click(doneButton);
      expect(screen.queryByText('일정을 확인하시겠어요?')).not.toBeInTheDocument();
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });
});
