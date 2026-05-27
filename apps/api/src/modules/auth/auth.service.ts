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
import { randomBytes } from 'crypto';
import type {
  SignupDto,
  LoginDto,
  AuthResponseDto,
  VerifyEmailDto,
  ResendVerificationDto,
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

const VERIFY_CODE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  async signup(dto: SignupDto): Promise<{ message: string }> {
    this.logger.log(`signup attempt: ${dto.email} role=${dto.role}`);
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      this.logger.warn(`signup conflict: ${dto.email} already exists`);
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const passwordHash = await argon2.hash(dto.password);
    const verifyCode = this.generateVerifyCode();
    const verifyExpiresAt = new Date(Date.now() + VERIFY_CODE_TTL_MS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: dto.role,
        emailVerifyToken: verifyCode,
        emailVerifyTokenExpiresAt: verifyExpiresAt,
        ...(dto.role === UserRole.THERAPIST
          ? { therapistProfile: { create: {} } }
          : { parentProfile: { create: {} } }),
      },
      include: {
        therapistProfile: true,
        parentProfile: true,
      },
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

    await this.email.sendVerificationCode(user.email, user.name, verifyCode);
    this.logger.log(`signup success: user=${user.id} email=${user.email}`);

    return { message: '인증 코드를 이메일로 발송했습니다.' };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<AuthResponseDto> {
    this.logger.log(`verifyEmail attempt: ${dto.email}`);
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new NotFoundException();

    if (user.emailVerifiedAt) {
      throw new BadRequestException('이미 인증된 이메일입니다.');
    }
    if (
      !user.emailVerifyToken ||
      !user.emailVerifyTokenExpiresAt ||
      user.emailVerifyToken !== dto.code ||
      user.emailVerifyTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('인증 코드가 올바르지 않거나 만료됐습니다.');
    }

    const verified = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerifyToken: null,
        emailVerifyTokenExpiresAt: null,
      },
    });

    const membership = await this.prisma.organizationMembership.findFirst({
      where: { therapistProfile: { userId: verified.id }, status: 'ACTIVE' },
      include: { organization: true },
    });

    this.logger.log(`verifyEmail success: user=${verified.id}`);
    return {
      ...this.generateTokens(verified),
      user: {
        id: verified.id,
        email: verified.email,
        name: verified.name,
        role: verified.role as UserRole,
      },
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

  async resendVerification(dto: ResendVerificationDto): Promise<{ message: string }> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) return { message: '인증 코드를 이메일로 발송했습니다.' }; // 이메일 존재 여부 노출 방지

    if (user.emailVerifiedAt) {
      throw new BadRequestException('이미 인증된 이메일입니다.');
    }

    const verifyCode = this.generateVerifyCode();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: verifyCode,
        emailVerifyTokenExpiresAt: new Date(Date.now() + VERIFY_CODE_TTL_MS),
      },
    });

    await this.email.sendVerificationCode(user.email, user.name, verifyCode);
    return { message: '인증 코드를 이메일로 발송했습니다.' };
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

  async logout(): Promise<void> {
    // 클라이언트 측 토큰 제거로 처리
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
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private generateJoinCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }
}
