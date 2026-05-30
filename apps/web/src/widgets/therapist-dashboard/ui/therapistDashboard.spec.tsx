import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ScheduleStatus } from '@eobom/shared';
import type { ScheduleResponseDto } from '@eobom/shared';
import { TherapistDashboard } from './therapistDashboard';

vi.mock('@/entities/user', () => ({}));

vi.mock('@/entities/schedule', () => ({
  ScheduleCard: ({ schedule }: { schedule: ScheduleResponseDto }) => (
    <div data-testid="schedule-card">
      <span>{schedule.childName}</span>
      <span>{schedule.title}</span>
    </div>
  ),
  useTodaySchedules: vi.fn((initialData?: ScheduleResponseDto[]) => ({
    data: initialData ?? [],
  })),
  useWeekSchedules: vi.fn((initialData?: ScheduleResponseDto[]) => ({
    data: initialData ?? [],
  })),
}));

vi.mock('@/shared/ui', () => ({
  SectionHeader: ({ title, right }: { title: string; right: React.ReactNode }) => (
    <div>
      <span>{title}</span>
      {right}
    </div>
  ),
}));

vi.mock('@/shared/lib/date', () => ({
  getKSTWeekStart: vi.fn().mockReturnValue(new Date('2026-05-25T15:00:00.000Z')),
  toKSTDateString: vi.fn().mockImplementation((d: string | Date) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toISOString().slice(0, 10);
  }),
}));

const mockSchedule: ScheduleResponseDto = {
  id: 's1',
  childId: 'c1',
  childName: '김아동',
  therapistId: 't1',
  startAt: '2026-05-28T01:00:00.000Z',
  endAt: '2026-05-28T02:00:00.000Z',
  status: ScheduleStatus.SCHEDULED,
  title: '언어치료',
  notes: null,
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('TherapistDashboard', () => {
  it('일정이 있을 때 childName과 title을 렌더링한다', () => {
    render(
      <TherapistDashboard
        todayInitialData={[mockSchedule]}
        weekInitialData={[mockSchedule]}
        userProfile={null}
        todayLabel="5월 30일 (금)"
      />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText('김아동')).toBeInTheDocument();
    expect(screen.getByText('언어치료')).toBeInTheDocument();
  });

  it('오늘 일정이 없을 때 빈 상태 메시지를 표시한다', () => {
    render(
      <TherapistDashboard
        todayInitialData={[]}
        weekInitialData={[]}
        userProfile={null}
        todayLabel="5월 30일 (금)"
      />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText('오늘 예정된 일정이 없습니다')).toBeInTheDocument();
  });

  it('오늘 일정 건수를 표시한다', () => {
    render(
      <TherapistDashboard
        todayInitialData={[mockSchedule]}
        weekInitialData={[]}
        userProfile={null}
        todayLabel="5월 30일 (금)"
      />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/오늘 일정 · 1건/)).toBeInTheDocument();
  });

  it('이번 주 건수를 표시한다', () => {
    render(
      <TherapistDashboard
        todayInitialData={[]}
        weekInitialData={[mockSchedule]}
        userProfile={null}
        todayLabel="5월 30일 (금)"
      />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/이번 주 · 1건/)).toBeInTheDocument();
  });

  it('전체 일정 링크가 /schedules를 가리킨다', () => {
    render(
      <TherapistDashboard
        todayInitialData={[]}
        weekInitialData={[]}
        userProfile={null}
        todayLabel="5월 30일 (금)"
      />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByRole('link', { name: '전체 일정' })).toHaveAttribute('href', '/schedules');
  });

  it('요일 점(월~일)을 모두 렌더링한다', () => {
    render(
      <TherapistDashboard
        todayInitialData={[]}
        weekInitialData={[]}
        userProfile={null}
        todayLabel="5월 30일 (금)"
      />,
      { wrapper: makeWrapper() },
    );
    for (const dow of ['월', '화', '수', '목', '금', '토', '일']) {
      expect(screen.getByText(dow)).toBeInTheDocument();
    }
  });
});
