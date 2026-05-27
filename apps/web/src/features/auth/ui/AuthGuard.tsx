'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { tokenStorage } from '../model/tokenStorage';
import type { UserRole } from '@eobom/shared';

interface Props {
  requiredRole: UserRole;
  children: React.ReactNode;
}

export function AuthGuard({ requiredRole, children }: Props) {
  const router = useRouter();

  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      if (payload.role !== requiredRole) {
        router.replace('/login');
      }
    } catch {
      tokenStorage.clear();
      router.replace('/login');
    }
  }, [requiredRole, router]);

  return <>{children}</>;
}
