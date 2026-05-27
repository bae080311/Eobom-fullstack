'use client';

import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { ApiError } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
          mutations: { retry: false },
        },
        mutationCache: new MutationCache({
          onError(error) {
            if (error instanceof ApiError && error.status < 500) return;
            toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
