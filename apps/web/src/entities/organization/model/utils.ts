import type { OrgMemberRole } from '@eobom/shared';
import { formatDateLabel, formatTime } from '@/shared/lib/date';
import koMessages from '../../../../messages/ko.json';

// ko.json에 OrgMemberRole 모든 값에 대응하는 키가 있는지 컴파일 타임에 검증한다.
// 신규 역할 추가 시 이 라인이 타입 에러로 알려준다 — 실제 번역은 컴포넌트의 t(`role.${role}`) 호출이 담당.
export const ORG_MEMBER_ROLE_LABELS_KO = koMessages.entities.organization.role satisfies Record<
  OrgMemberRole,
  string
>;

export function formatJoinedAtLabel(iso: string): string {
  return `${formatDateLabel(iso)} ${formatTime(iso)}`;
}
