import { Injectable } from '@nestjs/common';
import type { SignupDto, LoginDto, AuthResponseDto } from '@eobom/shared';

// Phase 2에서 전체 구현 예정 (JWT, argon2, Prisma, OrganizationMembership 발급)
@Injectable()
export class AuthService {
  async signup(_dto: SignupDto): Promise<AuthResponseDto> {
    throw new Error('Not implemented - Phase 2');
  }

  async login(_dto: LoginDto): Promise<AuthResponseDto> {
    throw new Error('Not implemented - Phase 2');
  }

  async refresh(_dto: { refreshToken: string }): Promise<Pick<AuthResponseDto, 'accessToken'>> {
    throw new Error('Not implemented - Phase 2');
  }

  async logout(): Promise<void> {
    // 클라이언트 측 토큰 제거로 처리
  }
}
