import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InviteCodeStatus } from '@eobom/shared';
import type { InviteCodeResponseDto } from '@eobom/shared';
import { InviteCodeRow } from './InviteCodeRow';
import { createTestTranslator } from '@/test/createTestTranslator';
import ko from '../../../../messages/ko.json';

const t = createTestTranslator(ko.entities.inviteCode);

function makeCode(overrides: Partial<InviteCodeResponseDto> = {}): InviteCodeResponseDto {
  return {
    id: 'ic1',
    code: 'ABCD1234',
    status: InviteCodeStatus.ACTIVE,
    expiresAt: '2026-06-20T05:30:00.000Z',
    createdAt: '2026-06-20T04:30:00.000Z',
    ...overrides,
  } as InviteCodeResponseDto;
}

describe('InviteCodeRow', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ACTIVE면 만료 시각까지 유효 라벨을 표시한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T05:00:00.000Z'));
    // 2026-06-20T05:30:00Z → KST 2026-06-20 14:30
    render(<InviteCodeRow code={makeCode()} t={t} />);
    expect(screen.getByText(/6월 20일/)).toBeInTheDocument();
    expect(screen.getByText(/14:30/)).toBeInTheDocument();
    expect(screen.getByText(/까지 유효/)).toBeInTheDocument();
  });

  it('ACTIVE가 아니면 발급일 라벨을 표시한다', () => {
    render(
      <InviteCodeRow
        code={makeCode({
          status: InviteCodeStatus.USED,
          expiresAt: '2026-06-20T00:00:00.000Z',
          createdAt: '2026-06-19T23:00:00.000Z',
        })}
        t={t}
      />,
    );
    // 2026-06-19T23:00:00Z → KST 2026-06-20 08:00
    expect(screen.getByText(/6월 20일/)).toBeInTheDocument();
    expect(screen.getByText(/발급/)).toBeInTheDocument();
  });

  it('status가 ACTIVE로 남아있어도 만료 시각이 지났으면 발급일 라벨을 표시한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T06:00:00.000Z'));
    render(<InviteCodeRow code={makeCode()} t={t} />);
    expect(screen.queryByText(/까지 유효/)).not.toBeInTheDocument();
    expect(screen.getByText(/발급/)).toBeInTheDocument();
  });
});
