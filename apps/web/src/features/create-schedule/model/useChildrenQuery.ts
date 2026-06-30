'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchChildren } from '@/entities/child';
import { tokenStorage } from '@/features/auth/model/tokenStorage';

export const childrenKeys = { all: ['children'] as const };

export function useChildrenQuery(enabled: boolean) {
  return useQuery({
    queryKey: childrenKeys.all,
    queryFn: () => fetchChildren(tokenStorage.getAccess() ?? ''),
    enabled,
    staleTime: 60_000,
  });
}
