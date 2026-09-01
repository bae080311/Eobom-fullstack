import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { InviteCodeType, InviteCodeStatus } from '@eobom/shared';
import type { ChildResponseDto, InviteCodeResponseDto } from '@eobom/shared';

vi.mock('@/shared/ui', () => ({
  SectionHeader: ({ title, right }: { title: string; right: React.ReactNode }) => (
    <div>
      <span>{title}</span>
      {right}
    </div>
  ),
}));

vi.mock('@/features/issue-invite-code', () => ({
  IssueInviteCodeButton: ({ childId }: { childId: string }) => (
    <button type="button">발급-{childId}</button>
  ),
}));

vi.mock('@/features/revoke-invite-code', () => ({
  RevokeInviteCodeButton: ({ id }: { id: string }) => <button type="button">취소-{id}</button>,
}));

import { InviteCodeListView } from './InviteCodeListView';

function makeChild(overrides: Partial<ChildResponseDto> = {}): ChildResponseDto {
  return {
    id: 'c1',
    name: '홍길동',
    birthDate: null,
    memo: null,
    nextSessionAt: null,
    primaryTherapistId: null,
    primaryTherapistName: null,
    ...overrides,
  };
}

function makeCode(overrides: Partial<InviteCodeResponseDto> = {}): InviteCodeResponseDto {
  return {
    id: 'ic1',
    code: 'A1B2-C3D4',
    type: InviteCodeType.PARENT_LINK,
    status: InviteCodeStatus.ACTIVE,
    expiresAt: '2099-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    child: { id: 'c1', name: '홍길동' },
    organization: { id: 'org1', name: '이어봄 센터' },
    ...overrides,
  };
}

describe('InviteCodeListView', () => {
  it('담당 아동도, 코드도 없으면 안내 문구를 보여준다', () => {
    render(<InviteCodeListView items={[]} codes={[]} />);
    expect(screen.getByText('담당 아동이 없어요')).toBeInTheDocument();
  });

  it('담당 아동 섹션에는 발급 버튼을 보여준다', () => {
    render(<InviteCodeListView items={[makeChild()]} codes={[]} />);
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '발급-c1' })).toBeInTheDocument();
  });

  it('담당 목록에서 빠졌지만 발급 코드가 남아있는 아동도 섹션을 렌더링한다', () => {
    const orphanCode = makeCode({
      id: 'ic-orphan',
      child: { id: 'c2', name: '김철수' },
    });
    render(<InviteCodeListView items={[makeChild()]} codes={[orphanCode]} />);

    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소-ic-orphan' })).toBeInTheDocument();
  });

  it('담당 목록에서 빠진 아동에는 발급 버튼을 보여주지 않는다', () => {
    const orphanCode = makeCode({
      id: 'ic-orphan',
      child: { id: 'c2', name: '김철수' },
    });
    render(<InviteCodeListView items={[]} codes={[orphanCode]} />);

    const section = screen.getByText('김철수').closest('section')!;
    expect(within(section).queryByRole('button', { name: /^발급-/ })).toBeNull();
    expect(within(section).getByRole('button', { name: '취소-ic-orphan' })).toBeInTheDocument();
  });

  it('만료 시각이 지난 ACTIVE 코드는 취소 버튼을 보여주지 않는다', () => {
    const elapsedCode = makeCode({
      id: 'ic-elapsed',
      status: InviteCodeStatus.ACTIVE,
      expiresAt: '2000-01-01T00:00:00.000Z',
    });
    render(<InviteCodeListView items={[makeChild()]} codes={[elapsedCode]} />);

    expect(screen.queryByRole('button', { name: '취소-ic-elapsed' })).toBeNull();
  });
});
