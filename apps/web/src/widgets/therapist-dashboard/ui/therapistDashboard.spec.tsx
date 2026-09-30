import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ScheduleStatus } from '@eobom/shared';
import type { ScheduleResponseDto } from '@eobom/shared';
import { TherapistDashboard } from './therapistDashboard';
// 타입만 쓴다(런타임에 지워짐) — eslint 가 인라인 `import()` 타입을 금지한다
import type * as SharedUI from '@/shared/ui';

vi.mock('@/entities/user', () => ({}));

vi.mock('@/entities/schedule', () => ({
  useTodaySchedules: vi.fn((initialData?: ScheduleResponseDto[]) => ({
    data: initialData ?? [],
  })),
  useWeekSchedules: vi.fn((initialData?: ScheduleResponseDto[]) => ({
    data: initialData ?? [],
  })),
}));

// SectionHeader 만 단순화하고 TimeRail·WeekRibbon 은 진짜를 쓴다 — 순수 표시용
// 컴포넌트라 모킹하면 시간 축·주간 리본이 실제로 렌더되는지를 검증하지 못한다.
vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof SharedUI>()),
  SectionHeader: ({ title, right }: { title: string; right: React.ReactNode }) => (
    <div>
      <span>{title}</span>
      {right}
    </div>
  ),
}));

vi.mock('@/shared/lib/date', () => ({
  toKSTDateString: vi.fn().mockImplementation((d: string | Date) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toISOString().slice(0, 10);
  }),
  formatTime: vi.fn().mockReturnValue('10:00'),
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

function renderDashboard(props: Partial<React.ComponentProps<typeof TherapistDashboard>> = {}) {
  return render(
    <TherapistDashboard
      todayInitialData={[]}
      weekInitialData={[]}
      userProfile={null}
      organizationName={null}
      todayLabel="5월 30일 (금)"
      weekStart="2026-05-25T15:00:00.000Z"
      {...props}
    />,
    { wrapper: makeWrapper() },
  );
}

describe('TherapistDashboard', () => {
  it('일정이 있을 때 childName과 title을 렌더링한다', () => {
    renderDashboard({ todayInitialData: [mockSchedule], weekInitialData: [mockSchedule] });
    expect(screen.getByText('김아동')).toBeInTheDocument();
    expect(screen.getByText('언어치료')).toBeInTheDocument();
  });

  it('오늘 일정은 시각을 함께 보여준다', () => {
    renderDashboard({ todayInitialData: [mockSchedule] });
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('오늘 일정이 없을 때 빈 상태와 다음 행동을 함께 제시한다', () => {
    renderDashboard();
    expect(screen.getByText('오늘은 수업이 없어요')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '일정 추가하기' })).toHaveAttribute(
      'href',
      '/schedules',
    );
  });

  it('소속 기관명이 있으면 보여주고, 없으면 대체 문구를 쓴다', () => {
    const { unmount } = renderDashboard({ organizationName: '맑은소리 언어치료센터' });
    expect(screen.getByText('맑은소리 언어치료센터')).toBeInTheDocument();
    unmount();

    renderDashboard({ organizationName: null });
    expect(screen.getByText('소속 센터 없음')).toBeInTheDocument();
  });

  it('오늘 일정 건수를 표시한다', () => {
    renderDashboard({ todayInitialData: [mockSchedule] });
    expect(screen.getByText(/오늘 일정 · 1건/)).toBeInTheDocument();
  });

  it('이번 주 건수를 표시한다', () => {
    renderDashboard({ weekInitialData: [mockSchedule] });
    expect(screen.getByText(/이번 주 · 1건/)).toBeInTheDocument();
  });

  it('전체 일정 링크가 /schedules를 가리킨다', () => {
    renderDashboard();
    expect(screen.getByRole('link', { name: '전체 일정' })).toHaveAttribute('href', '/schedules');
  });

  // 회귀 방지: `GET /schedules` 는 status 를 주지 않으면 취소 건까지 돌려준다.
  // 그대로 세면 주간 리본 막대와 건수가 부푼다.
  it('취소된 수업은 건수·목록·주간 리본에서 모두 빠진다', () => {
    const canceled: ScheduleResponseDto = {
      ...mockSchedule,
      id: 's2',
      childName: '취소아동',
      status: ScheduleStatus.CANCELED,
    };
    renderDashboard({
      todayInitialData: [mockSchedule, canceled],
      weekInitialData: [mockSchedule, canceled],
    });

    expect(screen.getByText(/오늘 일정 · 1건/)).toBeInTheDocument();
    expect(screen.getByText(/이번 주 · 1건/)).toBeInTheDocument();
    expect(screen.queryByText('취소아동')).toBeNull();
    // 리본도 1건으로만 읽힌다
    expect(screen.getByText(/목 1건/)).toBeInTheDocument();
  });

  it('주간 리본에 월~일이 모두 있고 스크린리더가 건수를 읽을 수 있다', () => {
    renderDashboard({ weekInitialData: [mockSchedule] });
    for (const dow of ['월', '화', '수', '목', '금', '토', '일']) {
      expect(screen.getByText(dow)).toBeInTheDocument();
    }
    expect(screen.getByRole('group', { name: '이번 주 일정' })).toBeInTheDocument();
    // 세션이 있는 날은 "N건"이 읽힌다
    expect(screen.getByText(/목 1건/)).toBeInTheDocument();
  });
});
