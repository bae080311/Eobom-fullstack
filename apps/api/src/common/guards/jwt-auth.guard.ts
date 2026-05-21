import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

// Phase 2에서 @nestjs/passport + JwtStrategy로 교체 예정
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // TODO: JWT 토큰 검증 로직 구현
    throw new UnauthorizedException('인증이 필요합니다.');
  }
}
