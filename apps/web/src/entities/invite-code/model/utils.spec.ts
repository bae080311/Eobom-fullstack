import { describe, it, expect, vi, afterEach } from 'vitest';
import { InviteCodeStatus } from '@eobom/shared';
import { getEffectiveInviteCodeStatus } from './utils';
import ko from '../../../../messages/ko.json';

describe('entities.inviteCode.status 메시지', () => {
  it('모든 InviteCodeStatus 값에 번역 라벨이 존재한다', () => {
    for (const status of Object.values(InviteCodeStatus)) {
      expect(ko.entities.inviteCode.status[status]).toBeTruthy();
    }
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
