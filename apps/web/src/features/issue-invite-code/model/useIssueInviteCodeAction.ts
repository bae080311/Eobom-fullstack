'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { InviteCodeResponseDto } from '@eobom/shared';
import { useIssueParentLinkCode } from '@/entities/invite-code';
import { ApiError } from '@/lib/api';

export function useIssueInviteCodeAction(childId: string) {
  const t = useTranslations('features.issueInviteCode');
  const router = useRouter();
  const [issued, setIssued] = useState<InviteCodeResponseDto | null>(null);
  const { mutate, isPending } = useIssueParentLinkCode();

  function issue() {
    mutate(
      { childId },
      {
        onSuccess: (code) => {
          setIssued(code);
          router.refresh();
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : t('issueError'));
        },
      },
    );
  }

  function closeResult() {
    setIssued(null);
  }

  return { issued, isPending, issue, closeResult };
}
