import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleStatus } from '@eobom/shared';

const mockCancel = vi.fn();
const mockConfirm = vi.fn();
vi.mock('@/entities/schedule', () => ({
  useCancelSchedule: () => ({ mutate: mockCancel, isPending: false }),
  useConfirmSchedule: () => ({ mutate: mockConfirm, isPending: false }),
}));

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

import { TherapistScheduleActions } from './therapistScheduleActions';

describe('TherapistScheduleActions', () => {
  beforeEach(() => {
    mockCancel.mockReset();
    mockConfirm.mockReset();
    mockRefresh.mockReset();
  });

  it('수정(비활성)·취소·완료 처리 버튼을 렌더링한다', () => {
    render(<TherapistScheduleActions scheduleId="s1" status={ScheduleStatus.SCHEDULED} />);
    expect(screen.getByRole('button', { name: '수정' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '취소' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '완료 처리' })).toBeEnabled();
  });

  it('취소 → 다이얼로그 확인 시 cancel.mutate(scheduleId)가 호출된다', async () => {
    const user = userEvent.setup();
    render(<TherapistScheduleActions scheduleId="s1" status={ScheduleStatus.SCHEDULED} />);

    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.getByText('일정을 취소하시겠어요?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '취소하기' }));

    expect(mockCancel.mock.calls[0][0]).toBe('s1');
  });

  it('완료 처리 → 다이얼로그 확인 시 confirm.mutate(scheduleId)가 호출된다', async () => {
    const user = userEvent.setup();
    render(<TherapistScheduleActions scheduleId="s1" status={ScheduleStatus.SCHEDULED} />);

    await user.click(screen.getByRole('button', { name: '완료 처리' }));
    expect(screen.getByText('치료를 완료 처리할까요?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '완료' }));

    expect(mockConfirm.mock.calls[0][0]).toBe('s1');
  });

  it('이미 취소된 일정이면 취소·완료 처리 버튼이 비활성화된다', () => {
    render(<TherapistScheduleActions scheduleId="s1" status={ScheduleStatus.CANCELED} />);
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '완료 처리' })).toBeDisabled();
  });
});
