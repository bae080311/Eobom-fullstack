import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUpdate = vi.fn();
vi.mock('@/entities/schedule', () => ({
  useUpdateSchedule: () => ({ mutate: mockUpdate, isPending: false }),
}));

import { EditScheduleForm } from './EditScheduleForm';

const baseProps = {
  open: true,
  scheduleId: 's1',
  title: '개별 언어치료',
  startAt: '2026-06-19T05:00:00.000Z', // 14:00 KST
  endAt: '2026-06-19T05:40:00.000Z', // 14:40 KST
  notes: '메모입니다',
  onClose: vi.fn(),
};

describe('EditScheduleForm', () => {
  beforeEach(() => {
    mockUpdate.mockReset();
  });

  it('제목만 변경해서 제출하면 dto에 startAt/endAt이 포함되지 않는다', async () => {
    const user = userEvent.setup();
    render(<EditScheduleForm {...baseProps} />);

    const titleInput = screen.getByPlaceholderText('예: 언어치료');
    await user.clear(titleInput);
    await user.type(titleInput, '그룹 언어치료');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const dto = mockUpdate.mock.calls[0][0].dto;
    expect(dto.title).toBe('그룹 언어치료');
    expect(dto).not.toHaveProperty('startAt');
    expect(dto).not.toHaveProperty('endAt');
  });

  it('시작 시간을 변경해서 제출하면 dto에 startAt이 새 값으로 포함된다', async () => {
    const user = userEvent.setup();
    render(<EditScheduleForm {...baseProps} />);

    const startTimeInput = screen.getByLabelText('시작 시간') as HTMLInputElement;
    fireEvent.change(startTimeInput, { target: { value: '13:00' } });
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const dto = mockUpdate.mock.calls[0][0].dto;
    expect(dto.startAt).toBe(new Date('2026-06-19T13:00:00+09:00').toISOString());
    expect(dto.startAt).not.toBe(baseProps.startAt);
  });

  it('메모를 비우고 제출하면 dto에 notes: 빈 문자열이 명시적으로 포함된다', async () => {
    const user = userEvent.setup();
    render(<EditScheduleForm {...baseProps} />);

    const notesInput = screen.getByRole('textbox', { name: '메모 (선택)' });
    await user.clear(notesInput);
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const dto = mockUpdate.mock.calls[0][0].dto;
    expect(dto.notes).toBe('');
    expect(dto.notes).not.toBeUndefined();
  });
});
