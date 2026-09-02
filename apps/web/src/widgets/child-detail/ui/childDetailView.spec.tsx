import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ChildResponseDto } from '@eobom/shared';

import { ChildDetailView } from './childDetailView';
import { createTestTranslator } from '@/test/createTestTranslator';
import ko from '../../../../messages/ko.json';

const t = createTestTranslator(ko.entities.child);

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function makeChild(overrides: Partial<ChildResponseDto> = {}): ChildResponseDto {
  return {
    id: 'c1',
    name: '홍길동',
    birthDate: '2019-05-10T00:00:00.000Z',
    memo: null,
    nextSessionAt: null,
    primaryTherapistId: null,
    primaryTherapistName: null,
    ...overrides,
  };
}

describe('ChildDetailView', () => {
  it('아동 이름과 생년월일을 표시한다', () => {
    render(<ChildDetailView child={makeChild()} backHref="/children" footer={null} t={t} />);
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('2019년 5월 10일')).toBeInTheDocument();
  });

  it('생년월일이 없으면 등록되지 않음으로 표시한다', () => {
    render(
      <ChildDetailView
        child={makeChild({ birthDate: null })}
        backHref="/children"
        footer={null}
        t={t}
      />,
    );
    expect(screen.getByText('등록되지 않음')).toBeInTheDocument();
  });

  it('담당 치료사 이름을 표시한다', () => {
    render(
      <ChildDetailView
        child={makeChild({ primaryTherapistName: '이치료' })}
        backHref="/children"
        footer={null}
        t={t}
      />,
    );
    expect(screen.getByText('이치료')).toBeInTheDocument();
  });

  it('담당 치료사가 없으면 지정되지 않음으로 표시한다', () => {
    render(<ChildDetailView child={makeChild()} backHref="/children" footer={null} t={t} />);
    expect(screen.getByText('지정되지 않음')).toBeInTheDocument();
  });

  it('memo가 있으면 메모 섹션을 표시한다', () => {
    render(
      <ChildDetailView
        child={makeChild({ memo: '받침 발음 연습' })}
        backHref="/children"
        footer={null}
        t={t}
      />,
    );
    expect(screen.getByText('받침 발음 연습')).toBeInTheDocument();
    expect(screen.getByText('메모')).toBeInTheDocument();
  });

  it('memo가 null이면 메모 섹션을 렌더링하지 않는다', () => {
    render(<ChildDetailView child={makeChild()} backHref="/children" footer={null} t={t} />);
    expect(screen.queryByText('메모')).not.toBeInTheDocument();
  });

  it('footer 노드를 렌더링한다', () => {
    render(
      <ChildDetailView
        child={makeChild()}
        backHref="/children"
        footer={<div data-testid="footer-slot">FOOTER</div>}
        t={t}
      />,
    );
    expect(screen.getByTestId('footer-slot')).toBeInTheDocument();
  });

  it('inviteCodeAction 노드를 렌더링한다', () => {
    render(
      <ChildDetailView
        child={makeChild()}
        backHref="/children"
        footer={null}
        inviteCodeAction={<div data-testid="invite-code-action">발급</div>}
        t={t}
      />,
    );
    expect(screen.getByTestId('invite-code-action')).toBeInTheDocument();
  });

  it('backHref를 뒤로가기 링크에 적용한다', () => {
    const { container } = render(
      <ChildDetailView child={makeChild()} backHref="/children" footer={null} t={t} />,
    );
    expect(container.querySelector('a')).toHaveAttribute('href', '/children');
  });
});
