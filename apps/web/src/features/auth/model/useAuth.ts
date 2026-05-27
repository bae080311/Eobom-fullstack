'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type {
  SendVerificationCodeDto,
  VerifyCodeDto,
  SignupDto,
  LoginDto,
  UserRole,
} from '@eobom/shared';
import * as authApi from '../api/authApi';
import { tokenStorage } from './tokenStorage';
import { ROLE_HOME } from '@/shared/lib/routes';

export function useSendVerificationCode() {
  return useMutation({
    mutationFn: (dto: SendVerificationCodeDto) => authApi.sendVerificationCode(dto),
  });
}

export function useVerifyCode() {
  return useMutation({
    mutationFn: (dto: VerifyCodeDto) => authApi.verifyCode(dto),
  });
}

export function useSignup() {
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: SignupDto) => authApi.signup(dto),
    onSuccess(data) {
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      const role: UserRole = data.user.role;
      router.replace(role === 'THERAPIST' ? ROLE_HOME.THERAPIST : ROLE_HOME.PARENT);
    },
  });
}

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: LoginDto) => authApi.login(dto),
    onSuccess(data) {
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      const role: UserRole = data.user.role;
      router.replace(role === 'THERAPIST' ? ROLE_HOME.THERAPIST : ROLE_HOME.PARENT);
    },
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
