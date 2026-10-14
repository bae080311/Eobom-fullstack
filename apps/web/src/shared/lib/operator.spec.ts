import { describe, it, expect } from 'vitest';
import { isOperatorPublished, type OperatorInfo } from './operator';

const EMPTY: OperatorInfo = {
  name: null,
  representative: null,
  businessNumber: null,
  address: null,
  contactEmail: null,
  privacyOfficerName: null,
};

describe('isOperatorPublished', () => {
  it('모든 항목이 비어 있으면 게시되지 않은 것으로 본다', () => {
    expect(isOperatorPublished(EMPTY)).toBe(false);
  });

  it('항목이 하나만 채워져도 게시된 것으로 본다', () => {
    expect(isOperatorPublished({ ...EMPTY, contactEmail: 'privacy@example.com' })).toBe(true);
  });

  it('빈 문자열은 채워진 값으로 본다 — 의도적으로 비운 항목과 미확정을 구분하지 않는다', () => {
    // `null` 만 "아직 정하지 않음"이다. 사업자등록번호처럼 해당 없는 항목을 빈
    // 문자열로 두는 운영을 허용하기 위해 값의 내용은 보지 않는다.
    expect(isOperatorPublished({ ...EMPTY, businessNumber: '' })).toBe(true);
  });
});
