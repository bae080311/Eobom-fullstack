import { InviteCodeStatus } from '@eobom/shared';
import type { InviteCodeResponseDto } from '@eobom/shared';
import koMessages from '../../../../messages/ko.json';

// ko.json에 InviteCodeStatus 모든 값에 대응하는 키가 있는지 컴파일 타임에 검증한다.
// 신규 상태값 추가 시 이 라인이 타입 에러로 알려준다 — 실제 번역은 컴포넌트의 t(`status.${status}`) 호출이 담당.
export const INVITE_CODE_STATUS_LABELS_KO = koMessages.entities.inviteCode.status satisfies Record<
  InviteCodeStatus,
  string
>;

// InviteCode.status는 redeem 시도 시점에만 EXPIRED로 갱신되므로, 미사용 상태로 유효기간이
// 지난 코드는 서버 응답에서도 여전히 ACTIVE로 남아있다 — 화면 표시는 expiresAt으로 직접 판별한다.
export function getEffectiveInviteCodeStatus(
  code: Pick<InviteCodeResponseDto, 'status' | 'expiresAt'>,
): InviteCodeStatus {
  const isElapsed =
    code.status === InviteCodeStatus.ACTIVE && new Date(code.expiresAt) < new Date();
  return isElapsed ? InviteCodeStatus.EXPIRED : code.status;
}
