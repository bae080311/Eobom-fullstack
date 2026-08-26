import { OrgMemberRole } from '@eobom/shared';
import { formatDateLabel, formatTime } from '@/shared/lib/date';

export function formatOrgMemberRoleLabel(role: OrgMemberRole): string {
  return role === OrgMemberRole.OWNER ? '소유자' : '치료사';
}

export function formatJoinedAtLabel(iso: string): string {
  return `${formatDateLabel(iso)} ${formatTime(iso)}`;
}
