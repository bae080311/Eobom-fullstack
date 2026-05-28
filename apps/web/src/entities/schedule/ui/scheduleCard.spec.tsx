import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScheduleStatus } from '@eobom/shared';
import type { ScheduleResponseDto } from '@eobom/shared';
import { ScheduleCard } from './scheduleCard';

function makeSchedule(overrides: Partial<ScheduleResponseDto> = {}): ScheduleResponseDto {
  return {
    id: 's1',
    childId: 'c1',
    childName: '김아동',
    therapistId: 't1',
    startAt: new Date(2024, 0, 15, 10, 0, 0).toISOString(),
    endAt: new Date(2024, 0, 15, 11, 30, 0).toISOString(),
    status: ScheduleStatus.SCHEDULED,
    title: '언어치료',
    notes: null,
    ...overrides,
  };
}

describe('ScheduleCard', () => {
  describe('기본 렌더링', () => {
    it('아동명을 표시한다', () => {
      render(<ScheduleCard schedule={makeSchedule()} />);
      expect(screen.getByText('김아동')).toBeInTheDocument();
    });

    it('치료 제목을 표시한다', () => {
      render(<ScheduleCard schedule={makeSchedule()} />);
      expect(screen.getByText('언어치료')).toBeInTheDocument();
    });

    it('시작 시간을 HH:mm 형식으로 표시한다', () => {
      render(<ScheduleCard schedule={makeSchedule()} />);
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('종료 시간을 HH:mm 형식으로 표시한다', () => {
      render(<ScheduleCard schedule={makeSchedule()} />);
      expect(screen.getByText('11:30')).toBeInTheDocument();
    });
  });

  describe('상태 배지', () => {
    it('SCHEDULED 상태 배지에 "예정" 텍스트를 표시한다', () => {
      render(<ScheduleCard schedule={makeSchedule({ status: ScheduleStatus.SCHEDULED })} />);
      expect(screen.getByText('예정')).toBeInTheDocument();
    });

    it('RESCHEDULED 상태 배지에 "변경됨" 텍스트를 표시한다', () => {
      render(<ScheduleCard schedule={makeSchedule({ status: ScheduleStatus.RESCHEDULED })} />);
      expect(screen.getByText('변경됨')).toBeInTheDocument();
    });

    it('CANCELED 상태 배지에 "취소됨" 텍스트를 표시한다', () => {
      render(<ScheduleCard schedule={makeSchedule({ status: ScheduleStatus.CANCELED })} />);
      expect(screen.getByText('취소됨')).toBeInTheDocument();
    });

    it('COMPLETED 상태 배지에 "완료" 텍스트를 표시한다', () => {
      render(<ScheduleCard schedule={makeSchedule({ status: ScheduleStatus.COMPLETED })} />);
      expect(screen.getByText('완료')).toBeInTheDocument();
    });
  });

  describe('notes 조건부 렌더링', () => {
    it('notes가 null이면 메모 영역을 렌더링하지 않는다', () => {
      render(<ScheduleCard schedule={makeSchedule({ notes: null })} />);
      expect(screen.queryByText(/메모/)).not.toBeInTheDocument();
    });

    it('notes가 있으면 해당 내용을 표시한다', () => {
      render(<ScheduleCard schedule={makeSchedule({ notes: '준비물: 그림카드' })} />);
      expect(screen.getByText('준비물: 그림카드')).toBeInTheDocument();
    });

    it('notes가 빈 문자열이면 표시하지 않는다', () => {
      // ScheduleCard 구현: {schedule.notes && <span className="... truncate mt-0.5">}
      // 빈 문자열("")은 falsy이므로 notes span이 렌더링되지 않는다
      const { container } = render(
        <ScheduleCard schedule={makeSchedule({ notes: '' as unknown as null })} />,
      );
      // notes span은 text-gray-400 클래스를 가진 유일한 span이다
      // (endTime span은 text-gray-400이지만 font-medium도 함께 가짐)
      const allSpans = Array.from(container.querySelectorAll('span'));
      const notesSpan = allSpans.find(
        (el) => el.classList.contains('text-gray-400') && !el.classList.contains('font-medium'),
      );
      expect(notesSpan).toBeUndefined();
    });
  });

  describe('상태별 왼쪽 테두리 색상', () => {
    it('SCHEDULED 상태는 왼쪽 바에 bg-brand 클래스를 갖는다', () => {
      const { container } = render(
        <ScheduleCard schedule={makeSchedule({ status: ScheduleStatus.SCHEDULED })} />,
      );
      const bar = container.querySelector('.bg-brand');
      expect(bar).toBeInTheDocument();
    });

    it('CANCELED 상태는 왼쪽 바에 bg-danger 클래스를 갖는다', () => {
      const { container } = render(
        <ScheduleCard schedule={makeSchedule({ status: ScheduleStatus.CANCELED })} />,
      );
      const bar = container.querySelector('.bg-danger');
      expect(bar).toBeInTheDocument();
    });

    it('COMPLETED 상태는 왼쪽 바에 bg-gray-300 클래스를 갖는다', () => {
      const { container } = render(
        <ScheduleCard schedule={makeSchedule({ status: ScheduleStatus.COMPLETED })} />,
      );
      const bar = container.querySelector('.bg-gray-300');
      expect(bar).toBeInTheDocument();
    });
  });

  describe('다양한 시간 포맷', () => {
    it('자정 시작 시간(00:00)을 올바르게 표시한다', () => {
      const d = new Date(2024, 0, 15, 0, 0, 0);
      render(<ScheduleCard schedule={makeSchedule({ startAt: d.toISOString() })} />);
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('분이 한 자리인 시간(09:05)을 올바르게 표시한다', () => {
      const start = new Date(2024, 0, 15, 9, 5, 0);
      const end = new Date(2024, 0, 15, 9, 50, 0);
      render(
        <ScheduleCard
          schedule={makeSchedule({ startAt: start.toISOString(), endAt: end.toISOString() })}
        />,
      );
      expect(screen.getByText('09:05')).toBeInTheDocument();
    });
  });
});
