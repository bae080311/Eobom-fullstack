import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockCreateSingle = vi.fn();
const mockCreateRecurring = vi.fn();
vi.mock('@/entities/schedule', () => ({
  useCreateSchedule: () => ({ mutate: mockCreateSingle, isPending: false }),
  useCreateRecurringSchedule: () => ({ mutate: mockCreateRecurring, isPending: false }),
}));

const mockToastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: (msg: string) => mockToastSuccess(msg) },
}));

import { CreateScheduleForm } from './CreateScheduleForm';

const baseProps = {
  open: true,
  childList: [{ id: 'c1', name: '김아동' }] as never[],
  childrenLoading: false,
  onClose: vi.fn(),
};

async function fillRecurringForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: '반복 일정' }));
  await user.selectOptions(screen.getByLabelText('아동'), 'c1');
  await user.type(screen.getByPlaceholderText('예: 언어치료'), '언어치료');
  await user.click(screen.getByText('월'));
  await user.click(screen.getByText('수'));
  await user.type(screen.getByLabelText('시작 시간'), '10:00');
  await user.type(screen.getByLabelText('종료 시간'), '11:00');
  await user.type(screen.getByLabelText('시작일'), '2026-08-03');
}

describe('CreateScheduleForm', () => {
  beforeEach(() => {
    mockCreateSingle.mockReset();
    mockCreateRecurring.mockReset();
    mockToastSuccess.mockReset();
    baseProps.onClose.mockReset();
  });

  it('기본값은 단일 일정 탭이다', () => {
    render(<CreateScheduleForm {...baseProps} />);

    expect(screen.getByRole('tab', { name: '단일 일정' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('날짜')).toBeInTheDocument();
    expect(screen.queryByText('반복 요일')).not.toBeInTheDocument();
  });

  it('반복 일정 탭을 클릭하면 요일·기간 입력으로 바뀐다', async () => {
    const user = userEvent.setup();
    render(<CreateScheduleForm {...baseProps} />);

    await user.click(screen.getByRole('tab', { name: '반복 일정' }));

    expect(screen.getByText('반복 요일')).toBeInTheDocument();
    expect(screen.getByText('시작일')).toBeInTheDocument();
    expect(screen.queryByText('메모 (선택)')).not.toBeInTheDocument();
  });

  it('반복 일정을 제출하면 선택한 요일·기간으로 useCreateRecurringSchedule을 호출한다', async () => {
    const user = userEvent.setup();
    render(<CreateScheduleForm {...baseProps} />);

    await fillRecurringForm(user);
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(mockCreateRecurring).toHaveBeenCalledTimes(1);
    const dto = mockCreateRecurring.mock.calls[0][0];
    expect(dto.childId).toBe('c1');
    expect(dto.title).toBe('언어치료');
    expect([...dto.daysOfWeek].sort()).toEqual([1, 3]);
    expect(dto.startTime).toBe('10:00');
    expect(dto.endTime).toBe('11:00');
    expect(dto.startDate).toBe('2026-08-03');
    expect(dto.endDate).toBeUndefined();
    expect(dto.timezone).toBe('Asia/Seoul');
  });

  it('반복 일정 생성 성공 시 건수를 포함한 toast를 보여주고 닫는다', async () => {
    mockCreateRecurring.mockImplementation((_, { onSuccess }) => {
      onSuccess({ schedules: [{}, {}, {}] });
    });
    const user = userEvent.setup();
    render(<CreateScheduleForm {...baseProps} />);

    await fillRecurringForm(user);
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(mockToastSuccess).toHaveBeenCalledWith('반복 일정 3건이 추가되었습니다');
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('단일 일정 제출 시 반복 관련 뮤테이션은 호출되지 않는다', async () => {
    const user = userEvent.setup();
    render(<CreateScheduleForm {...baseProps} />);

    await user.selectOptions(screen.getByLabelText('아동'), 'c1');
    await user.type(screen.getByPlaceholderText('예: 언어치료'), '언어치료');
    await user.type(screen.getByLabelText('날짜'), '2026-08-03');
    await user.type(screen.getByLabelText('시작 시간'), '10:00');
    await user.type(screen.getByLabelText('종료 시간'), '11:00');
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(mockCreateSingle).toHaveBeenCalledTimes(1);
    expect(mockCreateRecurring).not.toHaveBeenCalled();
  });
});
