'use client';

import { IconFileText } from '@/shared/ui';
import { useIssueInviteCodeAction } from '../model/useIssueInviteCodeAction';
import { InviteCodeIssuedDialog } from './InviteCodeIssuedDialog';

interface Props {
  childId: string;
}

export function IssueInviteCodeButton({ childId }: Props) {
  const { issued, isPending, issue, closeResult } = useIssueInviteCodeAction(childId);

  return (
    <>
      <button
        type="button"
        onClick={issue}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-caption font-semibold text-gray-700 border-0 cursor-pointer font-sans disabled:opacity-50"
      >
        <IconFileText size={14} /> {isPending ? '발급 중...' : '초대코드 발급'}
      </button>

      <InviteCodeIssuedDialog code={issued} onClose={closeResult} />
    </>
  );
}
