import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { IUser } from '@eobom/shared';
import { UsersService } from '../../users/users.service.js';

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret',
    });
  }

  /**
   * 페이로드를 그대로 믿지 않고 사용자 행을 다시 읽는다.
   *
   * 이전에는 payload만으로 IUser를 조립했다. 그러면 `request.user`가 "DB가 말하는
   * 사용자"가 아니라 "토큰이 말하는 사용자"가 되어, 계정을 삭제해도 access token
   * 수명(15분) 동안 보호된 라우트 33곳이 전부 열린 채로 남는다. `findById`가
   * `deletedAt: null`을 거르므로 탈퇴 즉시 차단된다.
   *
   * 비용은 요청당 PK 조회 1회다. 덤으로 createdAt·updatedAt이 실제 값이 된다
   * (전에는 `new Date()`로 채워 요청 시각을 돌려주고 있었다).
   */
  async validate(payload: JwtPayload): Promise<IUser> {
    if (!payload.sub) throw new UnauthorizedException();

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as IUser['role'],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
