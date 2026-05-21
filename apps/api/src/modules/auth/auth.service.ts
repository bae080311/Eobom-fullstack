import { Injectable } from '@nestjs/common';
import type { LoginDto, RegisterDto, AuthTokenDto } from '@eobom/shared';

// Phase 2에서 전체 구현 예정 (JWT, bcrypt, Prisma)
@Injectable()
export class AuthService {
  async register(_dto: RegisterDto): Promise<AuthTokenDto> {
    throw new Error('Not implemented - Phase 2');
  }

  async login(_dto: LoginDto): Promise<AuthTokenDto> {
    throw new Error('Not implemented - Phase 2');
  }

  async logout(): Promise<void> {
    // 클라이언트 측 토큰 제거로 처리
  }
}
