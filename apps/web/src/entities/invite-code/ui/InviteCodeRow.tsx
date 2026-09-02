import type { ReactNode } from 'react';
import { InviteCodeStatus } from '@eobom/shared';
import type { InviteCodeResponseDto } from '@eobom/shared';
import { InviteCodeStatusBadge } from './InviteCodeStatusBadge';
import { getEffectiveInviteCodeStatus } from '../model/utils';
import { formatDateLabel, formatTime } from '@/shared/lib/date';
import type { Translate } from '@/shared/lib/i18n';

interface Props {
  code: InviteCodeResponseDto;
  actions?: ReactNode;
  // 페이지(Server Component)에서 getTranslations('entities.inviteCode')로 미리 구한 번역기.
  t: Translate;
}

export function InviteCodeRow({ code, actions, t }: Props) {
  const status = getEffectiveInviteCodeStatus(code);
  const metaLabel =
    status === InviteCodeStatus.ACTIVE
      ? t('validUntil', { date: formatDateLabel(code.expiresAt), time: formatTime(code.expiresAt) })
      : t('issuedAt', { date: formatDateLabel(code.createdAt) });

  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="min-w-0">
        <p className="text-body font-bold tracking-wide text-gray-900 m-0 truncate">{code.code}</p>
        <p className="text-caption text-gray-600 m-0 mt-0.5 truncate">{metaLabel}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <InviteCodeStatusBadge status={status} label={t(`status.${status}`)} />
        {actions}
      </div>
    </div>
  );
}
