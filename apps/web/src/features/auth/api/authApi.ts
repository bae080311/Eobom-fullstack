import { api } from '@/lib/api';
import type {
  SendVerificationCodeDto,
  VerifyCodeDto,
  SignupDto,
  LoginDto,
  AuthResponseDto,
} from '@eobom/shared';

export async function sendVerificationCode(
  dto: SendVerificationCodeDto,
): Promise<{ message: string }> {
  return api.post<{ message: string }>('/auth/email/send-code', dto);
}

export async function verifyCode(dto: VerifyCodeDto): Promise<{ emailVerifiedToken: string }> {
  return api.post<{ emailVerifiedToken: string }>('/auth/email/verify-code', dto);
}

export async function signup(dto: SignupDto): Promise<AuthResponseDto> {
  return api.post<AuthResponseDto>('/auth/signup', dto);
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
