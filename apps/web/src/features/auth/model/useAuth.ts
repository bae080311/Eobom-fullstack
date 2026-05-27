'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type {
  SignupDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
  UserRole,
} from '@eobom/shared';
import * as authApi from '../api/authApi';
import { tokenStorage } from './tokenStorage';

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: LoginDto) => authApi.login(dto),
    onSuccess(data) {
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      const role: UserRole = data.user.role;
      router.replace(role === 'THERAPIST' ? '/dashboard' : '/home');
    },
    onError(error, variables) {
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`);
      }
    },
  });
}

export function useSignup() {
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: SignupDto) => authApi.signup(dto),
    onSuccess(_data, variables) {
      router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`);
    },
  });
}

export function useVerifyEmail() {
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: VerifyEmailDto) => authApi.verifyEmail(dto),
    onSuccess(data) {
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      const role: UserRole = data.user.role;
      router.replace(role === 'THERAPIST' ? '/dashboard' : '/home');
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (dto: ResendVerificationDto) => authApi.resendVerification(dto),
  });
}

export function useLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled() {
      tokenStorage.clear();
      router.replace('/login');
    },
  });
}
