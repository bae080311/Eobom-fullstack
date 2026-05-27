import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, randomInt } from 'crypto';
import type {
  SendVerificationCodeDto,
  VerifyCodeDto,
  SignupDto,
  LoginDto,
  AuthResponseDto,
} from '@eobom/shared';
import { OrgMemberRole, UserRole } from '@eobom/shared';
import { PrismaService } from '../../database/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { EmailService } from './email.service.js';

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

interface EmailVerifiedPayload {
  email: string;
  verified: true;
}

const VERIFY_CODE_TTL_MS = 10 * 60 * 1000;
const EMAIL_VERIFIED_TOKEN_TTL = '15m';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  async sendVerificationCode(dto: SendVerificationCodeDto): Promise<{ message: string }> {
    this.logger.log(`sendVerificationCode: ${dto.email}`);

    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      this.logger.warn(`sendVerificationCode conflict: ${dto.email} already exists`);
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const code = this.generateVerifyCode();

    await this.prisma.emailVerificationRequest.upsert({
      where: { email: dto.email },
      create: { email: dto.email, code, expiresAt: new Date(Date.now() + VERIFY_CODE_TTL_MS) },
      update: { code, expiresAt: new Date(Date.now() + VERIFY_CODE_TTL_MS) },
    });

    await this.email.sendVerificationCode(dto.email, code);
    return { message: '인증 코드를 이메일로 발송했습니다.' };
  }

  async verifyCode(dto: VerifyCodeDto): Promise<{ emailVerifiedToken: string }> {
    this.logger.log(`verifyCode attempt: ${dto.email}`);
    const req = await this.prisma.emailVerificationRequest.findUnique({
      where: { email: dto.email },
    });

    if (!req || req.code !== dto.code || req.expiresAt < new Date()) {
      this.logger.warn(`verifyCode failed: ${dto.email}`);
      throw new BadRequestException('인증 코드가 올바르지 않거나 만료됐습니다.');
    }

    await this.prisma.emailVerificationRequest.delete({ where: { email: dto.email } });

    const emailVerifiedToken = this.jwt.sign(
      { email: dto.email, verified: true } satisfies EmailVerifiedPayload,
      { expiresIn: EMAIL_VERIFIED_TOKEN_TTL },
    );
    this.logger.log(`verifyCode success: ${dto.email}`);
    return { emailVerifiedToken };
  }

  async signup(dto: SignupDto): Promise<AuthResponseDto> {
    const verifiedEmail = this.extractVerifiedEmail(dto.emailVerifiedToken);
    this.logger.log(`signup attempt: ${verifiedEmail} role=${dto.role}`);

    const existing = await this.users.findByEmail(verifiedEmail);
    if (existing) {
      this.logger.warn(`signup conflict: ${verifiedEmail} already exists`);
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: verifiedEmail,
        passwordHash,
        name: dto.name,
        role: dto.role,
        emailVerifiedAt: new Date(),
        ...(dto.role === UserRole.THERAPIST
          ? { therapistProfile: { create: {} } }
          : { parentProfile: { create: {} } }),
      },
      include: { therapistProfile: true, parentProfile: true },
    });

    if (dto.role === UserRole.THERAPIST && dto.organization && user.therapistProfile) {
      const therapistProfileId = user.therapistProfile.id;

      if (dto.organization.mode === 'CREATE') {
        await this.prisma.organization.create({
          data: {
            name: dto.organization.name,
            joinCode: this.generateJoinCode(),
            createdById: therapistProfileId,
            memberships: {
              create: { therapistProfileId, role: OrgMemberRole.OWNER },
            },
          },
        });
      } else {
        const org = await this.prisma.organization.findUnique({
          where: { joinCode: dto.organization.joinCode },
        });
        if (!org) throw new NotFoundException('유효하지 않은 참여 코드입니다.');
        await this.prisma.organizationMembership.create({
          data: { organizationId: org.id, therapistProfileId, role: OrgMemberRole.THERAPIST },
        });
      }
    }

    const membership = await this.prisma.organizationMembership.findFirst({
      where: { therapistProfile: { userId: user.id }, status: 'ACTIVE' },
      include: { organization: true },
    });

    this.logger.log(`signup success: user=${user.id}`);
    return {
      ...this.generateTokens(user),
      user: { id: user.id, email: user.email, name: user.name, role: user.role as UserRole },
      ...(membership
        ? {
            activeOrgMembership: {
              organizationId: membership.organizationId,
              organizationName: membership.organization.name,
              role: membership.role as OrgMemberRole,
            },
          }
        : {}),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`login attempt: ${dto.email}`);
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      this.logger.warn(`login failed: ${dto.email} not found`);
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      this.logger.warn(`login failed: ${dto.email} wrong password`);
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    if (!user.emailVerifiedAt) {
      this.logger.warn(`login failed: ${dto.email} email not verified`);
      throw new UnauthorizedException('EMAIL_NOT_VERIFIED');
    }

    const membership = await this.prisma.organizationMembership.findFirst({
      where: { therapistProfile: { userId: user.id }, status: 'ACTIVE' },
      include: { organization: true },
    });

    this.logger.log(`login success: user=${user.id} role=${user.role}`);
    return {
      ...this.generateTokens(user),
      user: { id: user.id, email: user.email, name: user.name, role: user.role as UserRole },
      ...(membership
        ? {
            activeOrgMembership: {
              organizationId: membership.organizationId,
              organizationName: membership.organization.name,
              role: membership.role as OrgMemberRole,
            },
          }
        : {}),
    };
  }

  async refresh(dto: { refreshToken: string }): Promise<Pick<AuthResponseDto, 'accessToken'>> {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(dto.refreshToken);
    } catch {
      this.logger.warn('refresh failed: invalid token');
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    const user = await this.users.findById(payload.sub);
    if (!user) {
      this.logger.warn(`refresh failed: user=${payload.sub} not found`);
      throw new UnauthorizedException();
    }

    const { accessToken } = this.generateTokens(user);
    return { accessToken };
  }

  async logout(): Promise<void> {}

  private extractVerifiedEmail(token: string): string {
    try {
      const payload = this.jwt.verify<EmailVerifiedPayload>(token);
      if (!payload.verified) throw new Error();
      return payload.email;
    } catch {
      throw new BadRequestException('이메일 인증이 필요합니다.');
    }
  }

  private generateTokens(user: { id: string; email: string; name: string; role: string }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwt.sign(payload, { expiresIn: '7d' }),
    };
  }

  private generateVerifyCode(): string {
    return randomInt(100000, 1000000).toString();
  }

  private generateJoinCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }
}
