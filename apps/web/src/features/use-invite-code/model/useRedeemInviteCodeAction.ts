'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { RedeemInviteCodeDto, RedeemInviteCodeResponseDto } from '@eobom/shared';
import { useRedeemInviteCode } from '@/entities/invite-code';
import { childKeys } from '@/entities/child';
import { ApiError } from '@/lib/api';

export function useRedeemInviteCodeAction() {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<RedeemInviteCodeResponseDto | null>(null);
  const { mutate, isPending } = useRedeemInviteCode();

  function submit(dto: RedeemInviteCodeDto) {
    mutate(dto, {
      onSuccess: (res) => {
        setResult(res);
        queryClient.invalidateQueries({ queryKey: childKeys.all });
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : '코드 확인에 실패했습니다');
      },
    });
  }

  return { result, isPending, submit };
}
