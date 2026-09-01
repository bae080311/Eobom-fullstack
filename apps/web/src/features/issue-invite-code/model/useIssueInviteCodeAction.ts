'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { InviteCodeResponseDto } from '@eobom/shared';
import { useIssueParentLinkCode } from '@/entities/invite-code';
import { ApiError } from '@/lib/api';

export function useIssueInviteCodeAction(childId: string) {
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
          toast.error(err instanceof ApiError ? err.message : '초대코드 발급에 실패했습니다');
        },
      },
    );
  }

  function closeResult() {
    setIssued(null);
  }

  return { issued, isPending, issue, closeResult };
}
