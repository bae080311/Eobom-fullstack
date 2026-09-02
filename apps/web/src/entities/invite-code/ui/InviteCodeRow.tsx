import type { ReactNode } from 'react';
import type { InviteCodeResponseDto } from '@eobom/shared';
import { InviteCodeStatusBadge } from './InviteCodeStatusBadge';
import { formatInviteCodeMetaLabel, getEffectiveInviteCodeStatus } from '../model/utils';

interface Props {
  code: InviteCodeResponseDto;
  actions?: ReactNode;
}

export function InviteCodeRow({ code, actions }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="min-w-0">
        <p className="text-body font-bold tracking-wide text-gray-900 m-0 truncate">{code.code}</p>
        <p className="text-caption text-gray-600 m-0 mt-0.5 truncate">
          {formatInviteCodeMetaLabel(code)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <InviteCodeStatusBadge status={getEffectiveInviteCodeStatus(code)} />
        {actions}
      </div>
    </div>
  );
}
