import { InviteCodeStatus } from '@eobom/shared';

interface Props {
  status: InviteCodeStatus;
  // 상위(InviteCodeRow)에서 t(`status.${status}`)로 미리 구한 라벨을 받는다.
  label: string;
}

const COLOR_CLS: Record<InviteCodeStatus, string> = {
  [InviteCodeStatus.ACTIVE]: 'bg-brand-softer text-brand',
  [InviteCodeStatus.USED]: 'bg-gray-100 text-gray-700',
  [InviteCodeStatus.EXPIRED]: 'bg-gray-100 text-gray-700',
  [InviteCodeStatus.REVOKED]: 'bg-danger-soft text-danger-strong',
};

export function InviteCodeStatusBadge({ status, label }: Props) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-caption font-semibold ${COLOR_CLS[status]}`}>
      {label}
    </span>
  );
}
