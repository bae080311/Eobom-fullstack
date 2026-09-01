'use client';

import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { tokenStorage } from '@/features/auth/model/tokenStorage';
import type {
  IssueParentLinkCodeDto,
  RedeemInviteCodeDto,
  InviteCodeResponseDto,
  RedeemInviteCodeResponseDto,
} from '@eobom/shared';

export const inviteCodeKeys = {
  all: ['invite-codes'] as const,
};

export function useIssueParentLinkCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: IssueParentLinkCodeDto) => {
      const token = tokenStorage.getAccess() ?? '';
      return api.post<InviteCodeResponseDto>('/invite-codes/parent-link', dto, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inviteCodeKeys.all });
    },
  });
}

export function useRevokeInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const token = tokenStorage.getAccess() ?? '';
      return api.delete<void>(`/invite-codes/${id}`, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inviteCodeKeys.all });
    },
  });
}

export function useRedeemInviteCode() {
  return useMutation({
    mutationFn: (dto: RedeemInviteCodeDto) => {
      const token = tokenStorage.getAccess() ?? '';
      return api.post<RedeemInviteCodeResponseDto>('/invite-codes/redeem', dto, { token });
    },
  });
}
