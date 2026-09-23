'use client';

import { useMutation } from '@tanstack/react-query';
import type { DeleteAccountDto } from '@eobom/shared';
import { deleteMyAccount } from '@/entities/user';
import { tokenStorage } from '@/features/auth';

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (dto: DeleteAccountDto) => {
      const token = tokenStorage.getAccess() ?? '';
      return deleteMyAccount(token, dto);
    },
  });
}
