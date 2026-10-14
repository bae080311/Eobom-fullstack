import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ko from '../../../../messages/ko.json';
import type { OperatorInfo } from '@/shared/lib/operator';
import { PrivacyPolicy } from './privacyPolicy';
import type { OperatorLabels, PrivacySection } from '../model/types';

// 방침 본문은 픽스처를 새로 만들지 않고 실제 번역 파일을 그대로 쓴다. 지어낸
// 픽스처로 렌더만 확인하면 "법정 필수 조항이 본문에서 사라졌다"를 잡지 못한다.
const SECTIONS = ko.app.privacy.sections as unknown as PrivacySection[];
const LABELS = ko.app.privacy.operatorLabels as OperatorLabels;
const PENDING = ko.app.privacy.operatorPending;

const EMPTY_OPERATOR: OperatorInfo = {
  name: null,
  representative: null,
  businessNumber: null,
  address: null,
  contactEmail: null,
  privacyOfficerName: null,
};

function renderPolicy(operator: OperatorInfo = EMPTY_OPERATOR) {
  return render(
    <PrivacyPolicy
      sections={SECTIONS}
      operator={operator}
      operatorLabels={LABELS}
      operatorPending={PENDING}
    />,
  );
}

describe('PrivacyPolicy', () => {
  it('모든 조문의 제목을 제목 요소로 렌더한다', () => {
    renderPolicy();

    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(SECTIONS.length);
    expect(headings.map((h) => h.textContent)).toEqual(SECTIONS.map((s) => s.heading));
  });

  // 개인정보 보호법 제30조 제1항과 제23조·제28조의8이 요구하는 항목들. 조 번호가
  // 바뀌어도 내용이 남아 있으면 통과하도록 제목 문구로 찾는다.
  it.each([
    '만 14세 미만 아동',
    '민감정보',
    '제3자 제공',
    '위탁',
    '국외 이전',
    '파기',
    '권리',
    '개인정보 보호책임자',
    '권익침해',
  ])('법정 필수 항목 "%s" 을 다룬 조문이 있다', (keyword) => {
    renderPolicy();

    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings.some((h) => h.textContent?.includes(keyword))).toBe(true);
  });

  it('실제 쿠키 이름과 보관 기간을 그대로 고지한다', () => {
    // `shared/lib/../features/auth/model/tokenStorage.ts` 의 max-age 와 맞아야 한다.
    // 코드가 바뀌었는데 방침이 그대로면 고지 내용이 거짓이 된다.
    renderPolicy();

    expect(screen.getByText('eobom_access')).toBeInTheDocument();
    expect(screen.getByText('15분')).toBeInTheDocument();
    expect(screen.getByText('eobom_refresh')).toBeInTheDocument();
    expect(screen.getByText('7일')).toBeInTheDocument();
  });

  it('표의 머리글을 열 스코프가 붙은 th 로 낸다', () => {
    renderPolicy();

    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBeGreaterThan(0);
    for (const th of columnHeaders) {
      expect(th).toHaveAttribute('scope', 'col');
    }
  });

  describe('운영 주체 블록', () => {
    it('아무 항목도 확정되지 않았으면 안내 문구를 보여주고 라벨은 내지 않는다', () => {
      renderPolicy();

      expect(screen.getByText(PENDING)).toBeInTheDocument();
      expect(screen.queryByText(LABELS.privacyOfficerName)).not.toBeInTheDocument();
      expect(screen.queryByText(LABELS.contactEmail)).not.toBeInTheDocument();
    });

    it('확정된 항목만 라벨과 함께 보여준다', () => {
      renderPolicy({
        ...EMPTY_OPERATOR,
        name: '이어봄',
        privacyOfficerName: '홍길동',
        contactEmail: 'privacy@example.com',
      });

      expect(screen.queryByText(PENDING)).not.toBeInTheDocument();
      expect(screen.getByText(LABELS.name)).toBeInTheDocument();
      expect(screen.getByText('이어봄')).toBeInTheDocument();
      expect(screen.getByText(LABELS.privacyOfficerName)).toBeInTheDocument();
      expect(screen.getByText('홍길동')).toBeInTheDocument();
      expect(screen.getByText('privacy@example.com')).toBeInTheDocument();

      // 비워 둔 항목은 라벨조차 내지 않는다 — 빈 칸이 보이면 누락으로 읽힌다.
      expect(screen.queryByText(LABELS.address)).not.toBeInTheDocument();
      expect(screen.queryByText(LABELS.businessNumber)).not.toBeInTheDocument();
    });
  });
});
