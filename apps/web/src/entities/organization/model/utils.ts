import { formatDateLabel, formatTime } from '@/shared/lib/date';

// 역할 라벨 텍스트는 messages/ko.json의 entities.organization.role 네임스페이스에서
// OrgMemberRole 값을 키로 그대로 조회한다 — useTranslations/getTranslations는 컴포넌트에서 호출.
export function formatJoinedAtLabel(iso: string): string {
  return `${formatDateLabel(iso)} ${formatTime(iso)}`;
}
