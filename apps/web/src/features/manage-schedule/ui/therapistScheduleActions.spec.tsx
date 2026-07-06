import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleStatus } from '@eobom/shared';

const mockCancel = vi.fn();
const mockConfirm = vi.fn();
const mockUpdate = vi.fn();
vi.mock('@/entities/schedule', () => ({
  useCancelSchedule: () => ({ mutate: mockCancel, isPending: false }),
  useConfirmSchedule: () => ({ mutate: mockConfirm, isPending: false }),
  useUpdateSchedule: () => ({ mutate: mockUpdate, isPending: false }),
}));

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

import { TherapistScheduleActions } from './therapistScheduleActions';

const baseProps = {
  scheduleId: 's1',
  title: '개별 언어치료',
  startAt: '2026-06-19T05:00:00.000Z',
  endAt: '2026-06-19T05:40:00.000Z',
  notes: null,
};

describe('TherapistScheduleActions', () => {
  beforeEach(() => {
    mockCancel.mockReset();
    mockConfirm.mockReset();
    mockUpdate.mockReset();
    mockRefresh.mockReset();
  });

  it('SCHEDULED 상태에서는 수정·취소·완료 처리 버튼이 모두 활성화된다', () => {
    render(<TherapistScheduleActions {...baseProps} status={ScheduleStatus.SCHEDULED} />);
    expect(screen.getByRole('button', { name: /수정/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: '취소' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '완료 처리' })).toBeEnabled();
  });

  it('취소 → 다이얼로그 확인 시 cancel.mutate(scheduleId)가 호출된다', async () => {
    const user = userEvent.setup();
    render(<TherapistScheduleActions {...baseProps} status={ScheduleStatus.SCHEDULED} />);

    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.getByText('일정을 취소하시겠어요?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '취소하기' }));

    expect(mockCancel.mock.calls[0][0]).toBe('s1');
  });

  it('완료 처리 → 다이얼로그 확인 시 confirm.mutate(scheduleId)가 호출된다', async () => {
    const user = userEvent.setup();
    render(<TherapistScheduleActions {...baseProps} status={ScheduleStatus.SCHEDULED} />);

    await user.click(screen.getByRole('button', { name: '완료 처리' }));
    expect(screen.getByText('치료를 완료 처리할까요?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '완료' }));

    expect(mockConfirm.mock.calls[0][0]).toBe('s1');
  });

  it('이미 취소된 일정이면 수정·취소·완료 처리 버튼이 비활성화된다', () => {
    render(<TherapistScheduleActions {...baseProps} status={ScheduleStatus.CANCELED} />);
    expect(screen.getByRole('button', { name: /수정/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '완료 처리' })).toBeDisabled();
  });

  it('수정 버튼 클릭 시 편집 폼이 열린다', async () => {
    const user = userEvent.setup();
    render(<TherapistScheduleActions {...baseProps} status={ScheduleStatus.SCHEDULED} />);

    await user.click(screen.getByRole('button', { name: /수정/ }));
    expect(screen.getByText('일정 수정')).toBeInTheDocument();
  });
});
