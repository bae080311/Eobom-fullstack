import { describe, it, expect, vi, afterEach } from 'vitest';
import { InviteCodeStatus } from '@eobom/shared';
import {
  formatInviteCodeStatusLabel,
  formatInviteCodeMetaLabel,
  getEffectiveInviteCodeStatus,
} from './utils';

describe('formatInviteCodeStatusLabel', () => {
  it('ACTIVE는 "사용 가능"이다', () => {
    expect(formatInviteCodeStatusLabel(InviteCodeStatus.ACTIVE)).toBe('사용 가능');
  });

  it('USED는 "사용됨"이다', () => {
    expect(formatInviteCodeStatusLabel(InviteCodeStatus.USED)).toBe('사용됨');
  });

  it('EXPIRED는 "만료됨"이다', () => {
    expect(formatInviteCodeStatusLabel(InviteCodeStatus.EXPIRED)).toBe('만료됨');
  });

  it('REVOKED는 "취소됨"이다', () => {
    expect(formatInviteCodeStatusLabel(InviteCodeStatus.REVOKED)).toBe('취소됨');
  });
});

describe('getEffectiveInviteCodeStatus', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ACTIVE이고 만료 전이면 ACTIVE를 반환한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T05:00:00.000Z'));
    expect(
      getEffectiveInviteCodeStatus({
        status: InviteCodeStatus.ACTIVE,
        expiresAt: '2026-06-20T05:30:00.000Z',
      }),
    ).toBe(InviteCodeStatus.ACTIVE);
  });

  it('ACTIVE이지만 만료 시각이 지났으면 EXPIRED를 반환한다 (redeem 시도 전이라 status는 아직 ACTIVE)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T06:00:00.000Z'));
    expect(
      getEffectiveInviteCodeStatus({
        status: InviteCodeStatus.ACTIVE,
        expiresAt: '2026-06-20T05:30:00.000Z',
      }),
    ).toBe(InviteCodeStatus.EXPIRED);
  });

  it('ACTIVE가 아니면 만료 시각과 무관하게 저장된 상태를 그대로 반환한다', () => {
    expect(
      getEffectiveInviteCodeStatus({
        status: InviteCodeStatus.USED,
        expiresAt: '2000-01-01T00:00:00.000Z',
      }),
    ).toBe(InviteCodeStatus.USED);
  });
});

describe('formatInviteCodeMetaLabel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ACTIVE면 만료 시각까지 유효 라벨을 만든다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T05:00:00.000Z'));
    // 2026-06-20T05:30:00Z → KST 2026-06-20 14:30
    const label = formatInviteCodeMetaLabel({
      status: InviteCodeStatus.ACTIVE,
      expiresAt: '2026-06-20T05:30:00.000Z',
      createdAt: '2026-06-20T04:30:00.000Z',
    });
    expect(label).toContain('6월 20일');
    expect(label).toContain('14:30');
    expect(label).toContain('까지 유효');
  });

  it('ACTIVE가 아니면 발급일 라벨을 만든다', () => {
    // 2026-06-19T23:00:00Z → KST 2026-06-20 08:00
    const label = formatInviteCodeMetaLabel({
      status: InviteCodeStatus.USED,
      expiresAt: '2026-06-20T00:00:00.000Z',
      createdAt: '2026-06-19T23:00:00.000Z',
    });
    expect(label).toContain('6월 20일');
    expect(label).toContain('발급');
  });

  it('status가 ACTIVE로 남아있어도 만료 시각이 지났으면 발급일 라벨을 만든다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T06:00:00.000Z'));
    const label = formatInviteCodeMetaLabel({
      status: InviteCodeStatus.ACTIVE,
      expiresAt: '2026-06-20T05:30:00.000Z',
      createdAt: '2026-06-20T04:30:00.000Z',
    });
    expect(label).not.toContain('까지 유효');
    expect(label).toContain('발급');
  });
});
