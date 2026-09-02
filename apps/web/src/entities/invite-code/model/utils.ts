import { InviteCodeStatus } from '@eobom/shared';
import type { InviteCodeResponseDto } from '@eobom/shared';
import { formatDateLabel, formatTime } from '@/shared/lib/date';

const STATUS_LABEL: Record<InviteCodeStatus, string> = {
  [InviteCodeStatus.ACTIVE]: '사용 가능',
  [InviteCodeStatus.USED]: '사용됨',
  [InviteCodeStatus.EXPIRED]: '만료됨',
  [InviteCodeStatus.REVOKED]: '취소됨',
};

export function formatInviteCodeStatusLabel(status: InviteCodeStatus): string {
  return STATUS_LABEL[status];
}

// InviteCode.status는 redeem 시도 시점에만 EXPIRED로 갱신되므로, 미사용 상태로 유효기간이
// 지난 코드는 서버 응답에서도 여전히 ACTIVE로 남아있다 — 화면 표시는 expiresAt으로 직접 판별한다.
export function getEffectiveInviteCodeStatus(
  code: Pick<InviteCodeResponseDto, 'status' | 'expiresAt'>,
): InviteCodeStatus {
  const isElapsed =
    code.status === InviteCodeStatus.ACTIVE && new Date(code.expiresAt) < new Date();
  return isElapsed ? InviteCodeStatus.EXPIRED : code.status;
}

export function formatInviteCodeMetaLabel(
  code: Pick<InviteCodeResponseDto, 'status' | 'expiresAt' | 'createdAt'>,
): string {
  if (getEffectiveInviteCodeStatus(code) === InviteCodeStatus.ACTIVE) {
    return `${formatDateLabel(code.expiresAt)} ${formatTime(code.expiresAt)}까지 유효`;
  }
  return `${formatDateLabel(code.createdAt)} 발급`;
}
