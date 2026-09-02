import { InviteCodeStatus } from '@eobom/shared';
import { formatInviteCodeStatusLabel } from '../model/utils';

interface Props {
  status: InviteCodeStatus;
}

const COLOR_CLS: Record<InviteCodeStatus, string> = {
  [InviteCodeStatus.ACTIVE]: 'bg-brand-softer text-brand',
  [InviteCodeStatus.USED]: 'bg-gray-100 text-gray-700',
  [InviteCodeStatus.EXPIRED]: 'bg-gray-100 text-gray-700',
  [InviteCodeStatus.REVOKED]: 'bg-danger-soft text-danger-strong',
};

export function InviteCodeStatusBadge({ status }: Props) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-caption font-semibold ${COLOR_CLS[status]}`}>
      {formatInviteCodeStatusLabel(status)}
    </span>
  );
}
