import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TherapistTabBar } from './therapistTabBar';

describe('TherapistTabBar', () => {
  it('홈과 일정 탭을 렌더링한다', () => {
    render(<TherapistTabBar active="home" />);
    expect(screen.getByRole('link', { name: '홈' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '일정' })).toBeInTheDocument();
  });

  it('active="home"이면 홈 링크가 text-brand 클래스를 가진다', () => {
    render(<TherapistTabBar active="home" />);
    const homeLink = screen.getByRole('link', { name: '홈' });
    const scheduleLink = screen.getByRole('link', { name: '일정' });
    expect(homeLink.className).toContain('text-brand');
    expect(scheduleLink.className).toContain('text-gray-400');
  });

  it('active="schedules"이면 일정 링크가 text-brand 클래스를 가진다', () => {
    render(<TherapistTabBar active="schedules" />);
    const homeLink = screen.getByRole('link', { name: '홈' });
    const scheduleLink = screen.getByRole('link', { name: '일정' });
    expect(scheduleLink.className).toContain('text-brand');
    expect(homeLink.className).toContain('text-gray-400');
  });

  it('홈 링크가 /dashboard를 가리킨다', () => {
    render(<TherapistTabBar active="home" />);
    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute('href', '/dashboard');
  });

  it('일정 링크가 /schedules를 가리킨다', () => {
    render(<TherapistTabBar active="schedules" />);
    expect(screen.getByRole('link', { name: '일정' })).toHaveAttribute('href', '/schedules');
  });

  it('내 정보 탭을 렌더링하고 /me를 가리킨다', () => {
    render(<TherapistTabBar active="me" />);
    expect(screen.getByRole('link', { name: '내 정보' })).toHaveAttribute('href', '/me');
  });

  it('active="me"이면 내 정보 링크가 text-brand 클래스를 가진다', () => {
    render(<TherapistTabBar active="me" />);
    const meLink = screen.getByRole('link', { name: '내 정보' });
    const homeLink = screen.getByRole('link', { name: '홈' });
    expect(meLink.className).toContain('text-brand');
    expect(homeLink.className).toContain('text-gray-400');
  });
});
