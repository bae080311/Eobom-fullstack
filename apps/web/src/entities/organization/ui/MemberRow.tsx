import type { ReactNode } from 'react';
import type { MemberResponseDto } from '@eobom/shared';
import { IconUser } from '@/shared/ui';
import { formatJoinedAtLabel } from '../model/utils';
import type { Translate } from '@/shared/lib/i18n';

interface Props {
  member: MemberResponseDto;
  isSelf: boolean;
  actions?: ReactNode;
  // 페이지(Server Component)에서 getTranslations('entities.organization')로 미리 구한 번역기.
  t: Translate;
}

export function MemberRow({ member, isSelf, actions, t }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
          <IconUser size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-body font-semibold text-gray-900 m-0 truncate">
            {member.user.name}
            {isSelf && (
              <span className="ml-1 text-caption font-medium text-gray-600">{t('self')}</span>
            )}
          </p>
          <p className="text-caption text-gray-600 m-0 truncate">{member.user.email}</p>
          <p className="text-caption text-gray-600 m-0 truncate">
            {t('joinedLabel', { date: formatJoinedAtLabel(member.joinedAt) })}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-full bg-brand-softer px-2.5 py-1 text-caption font-semibold text-brand">
          {t(`role.${member.role}`)}
        </span>
        {actions}
      </div>
    </div>
  );
}
