'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { UpdateProfileDto } from '@eobom/shared';
import { updateMyProfile } from '@/entities/user';
import { tokenStorage } from '@/features/auth/model/tokenStorage';

export function useUpdateProfile() {
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: UpdateProfileDto) => {
      const token = tokenStorage.getAccess() ?? '';
      return updateMyProfile(token, dto);
    },
    onSuccess() {
      router.refresh();
    },
  });
}
