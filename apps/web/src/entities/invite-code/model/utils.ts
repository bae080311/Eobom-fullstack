import { InviteCodeStatus } from '@eobom/shared';
import type { InviteCodeResponseDto } from '@eobom/shared';

// InviteCode.status는 redeem 시도 시점에만 EXPIRED로 갱신되므로, 미사용 상태로 유효기간이
// 지난 코드는 서버 응답에서도 여전히 ACTIVE로 남아있다 — 화면 표시는 expiresAt으로 직접 판별한다.
export function getEffectiveInviteCodeStatus(
  code: Pick<InviteCodeResponseDto, 'status' | 'expiresAt'>,
): InviteCodeStatus {
  const isElapsed =
    code.status === InviteCodeStatus.ACTIVE && new Date(code.expiresAt) < new Date();
  return isElapsed ? InviteCodeStatus.EXPIRED : code.status;
}
