import { describe, it, expect } from 'vitest';
import { OrgMemberRole } from '@eobom/shared';
import { ORG_MEMBER_ROLE_LABELS_KO, formatJoinedAtLabel } from './utils';

describe('ORG_MEMBER_ROLE_LABELS_KO', () => {
  it('OWNER는 "소유자"이다', () => {
    expect(ORG_MEMBER_ROLE_LABELS_KO[OrgMemberRole.OWNER]).toBe('소유자');
  });

  it('THERAPIST는 "치료사"이다', () => {
    expect(ORG_MEMBER_ROLE_LABELS_KO[OrgMemberRole.THERAPIST]).toBe('치료사');
  });
});

describe('formatJoinedAtLabel', () => {
  it('KST 날짜·시간 라벨을 만든다', () => {
    // 2026-06-20T01:00:00Z → KST 2026-06-20 10:00
    const label = formatJoinedAtLabel('2026-06-20T01:00:00Z');
    expect(label).toContain('6월 20일');
    expect(label).toContain('10:00');
  });
});
