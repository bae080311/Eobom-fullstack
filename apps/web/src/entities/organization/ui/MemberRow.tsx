import type { ReactNode } from 'react';
import type { MemberResponseDto } from '@eobom/shared';
import { IconUser } from '@/shared/ui';
import { formatOrgMemberRoleLabel, formatJoinedAtLabel } from '../model/utils';

interface Props {
  member: MemberResponseDto;
  isSelf: boolean;
  actions?: ReactNode;
}

export function MemberRow({ member, isSelf, actions }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <IconUser size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-body font-semibold text-gray-900 m-0 truncate">
            {member.user.name}
            {isSelf && <span className="ml-1 text-caption font-medium text-gray-400">(나)</span>}
          </p>
          <p className="text-caption text-gray-500 m-0 truncate">{member.user.email}</p>
          <p className="text-caption text-gray-400 m-0 truncate">
            {formatJoinedAtLabel(member.joinedAt)} 가입
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-full bg-brand-softer px-2.5 py-1 text-caption font-semibold text-brand">
          {formatOrgMemberRoleLabel(member.role)}
        </span>
        {actions}
      </div>
    </div>
  );
}
