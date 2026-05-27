import { api } from '@/lib/api';
import type {
  SignupDto,
  LoginDto,
  AuthResponseDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from '@eobom/shared';

export async function signup(dto: SignupDto): Promise<{ message: string }> {
  return api.post<{ message: string }>('/auth/signup', dto);
}

export async function verifyEmail(dto: VerifyEmailDto): Promise<AuthResponseDto> {
  return api.post<AuthResponseDto>('/auth/verify-email', dto);
}

export async function resendVerification(dto: ResendVerificationDto): Promise<{ message: string }> {
  return api.post<{ message: string }>('/auth/resend-verification', dto);
}

export async function login(dto: LoginDto): Promise<AuthResponseDto> {
  return api.post<AuthResponseDto>('/auth/login', dto);
}

export async function refresh(refreshToken: string): Promise<{ accessToken: string }> {
  return api.post<{ accessToken: string }>('/auth/refresh', { refreshToken });
}

export async function logout(): Promise<void> {
  return api.post<void>('/auth/logout', {});
}
