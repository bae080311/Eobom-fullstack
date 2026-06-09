import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScheduleStatus } from '@eobom/shared';
import type { ScheduleDetailResponseDto } from '@eobom/shared';

import { ScheduleDetailView } from './scheduleDetailView';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

// KST 10:00 = UTC 01:00, KST 11:00 = UTC 02:00
function makeDetail(overrides: Partial<ScheduleDetailResponseDto> = {}): ScheduleDetailResponseDto {
  return {
    id: 's1',
    childId: 'c1',
    childName: '김아동',
    therapistId: 't1',
    startAt: '2024-01-15T01:00:00.000Z',
    endAt: '2024-01-15T02:00:00.000Z',
    status: ScheduleStatus.SCHEDULED,
    title: '언어치료',
    notes: null,
    therapistName: '이치료',
    acknowledged: false,
    acknowledgedAt: null,
    ...overrides,
  };
}

describe('ScheduleDetailView', () => {
  it('아동명·치료사명·치료 종류를 표시한다', () => {
    render(<ScheduleDetailView schedule={makeDetail()} backHref="/schedule" footer={null} />);
    expect(screen.getByText('김아동')).toBeInTheDocument();
    expect(screen.getByText('이치료')).toBeInTheDocument();
    expect(screen.getAllByText('언어치료').length).toBeGreaterThan(0);
  });

  it('상태 배지 라벨을 표시한다', () => {
    render(<ScheduleDetailView schedule={makeDetail()} backHref="/schedule" footer={null} />);
    expect(screen.getByText('예정')).toBeInTheDocument();
  });

  it('시간을 KST HH:mm 범위로 표시한다', () => {
    render(<ScheduleDetailView schedule={makeDetail()} backHref="/schedule" footer={null} />);
    expect(screen.getAllByText(/10:00 ~ 11:00/).length).toBeGreaterThan(0);
  });

  it('notes가 있으면 메모를 표시한다', () => {
    render(
      <ScheduleDetailView
        schedule={makeDetail({ notes: '받침 발음 연습' })}
        backHref="/schedule"
        footer={null}
      />,
    );
    expect(screen.getByText('받침 발음 연습')).toBeInTheDocument();
    expect(screen.getByText('메모')).toBeInTheDocument();
  });

  it('notes가 null이면 메모 섹션을 렌더링하지 않는다', () => {
    render(
      <ScheduleDetailView
        schedule={makeDetail({ notes: null })}
        backHref="/schedule"
        footer={null}
      />,
    );
    expect(screen.queryByText('메모')).not.toBeInTheDocument();
  });

  it('footer 노드를 렌더링한다', () => {
    render(
      <ScheduleDetailView
        schedule={makeDetail()}
        backHref="/schedule"
        footer={<div data-testid="footer-slot">FOOTER</div>}
      />,
    );
    expect(screen.getByTestId('footer-slot')).toBeInTheDocument();
  });

  it('backHref를 뒤로가기 링크에 적용한다', () => {
    const { container } = render(
      <ScheduleDetailView schedule={makeDetail()} backHref="/schedules" footer={null} />,
    );
    expect(container.querySelector('a')).toHaveAttribute('href', '/schedules');
  });
});
