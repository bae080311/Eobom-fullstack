import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { OrgMemberRole, OrgMembershipStatus, UserRole } from '@eobom/shared';
import type { DeleteAccountDto, UpdateProfileDto } from '@eobom/shared';
import { PrismaService } from '../../database/prisma.service.js';

/** 탈퇴 계정의 이메일을 대체할 도메인. 실제로 메일이 가지 않는 예약 도메인이다. */
const DELETED_EMAIL_DOMAIN = 'deleted.eobom.local';

/** 기관 멤버 목록 등 남아 있는 화면에서 탈퇴 계정을 가리킬 이름. */
const DELETED_USER_NAME = '탈퇴한 사용자';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { therapistProfile: true, parentProfile: true },
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`updateMe: user ${userId} not found`);
      throw new NotFoundException();
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (user.role === UserRole.THERAPIST && dto.licenseNumber !== undefined) {
      data.therapistProfile = {
        upsert: {
          create: { licenseNumber: dto.licenseNumber },
          update: { licenseNumber: dto.licenseNumber },
        },
      };
    }

    if (user.role === UserRole.PARENT && dto.phoneNumber !== undefined) {
      data.parentProfile = {
        upsert: {
          create: { phoneNumber: dto.phoneNumber },
          update: { phoneNumber: dto.phoneNumber },
        },
      };
    }

    if (Object.keys(data).length === 0) {
      return this.getMe(userId);
    }

    // 단일 update 쿼리로 user + profile을 트랜잭션 안전하게 갱신
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: { therapistProfile: true, parentProfile: true },
    });
    this.logger.log(`User ${userId} updated profile`);
    return updated;
  }

  /**
   * 계정 삭제(소프트 삭제 + 익명화).
   *
   * 물리 삭제를 하지 않는 이유는 `schema.prisma`의 User 모델 주석 참고 — 치료사가
   * 만든 Schedule·SessionReport·InviteCode는 기관 자산이라 남아야 하고, FK가
   * Restrict라 DB도 삭제를 거부한다.
   *
   * argon2 검증·해시는 트랜잭션 밖에서 끝낸다(각 100ms 수준이라 인터랙티브
   * 트랜잭션의 기본 timeout 5s를 점유할 이유가 없다).
   */
  async deleteMe(userId: string, dto: DeleteAccountDto): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      this.logger.warn(`deleteMe: user ${userId} not found`);
      throw new NotFoundException();
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      this.logger.warn(`deleteMe: user ${userId} wrong password`);
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }

    // 로그인 경로는 deletedAt으로 이미 막히지만, 비밀번호 해시 자체가 개인정보라
    // 복구 불가능한 값으로 덮는다.
    const scrambledHash = await argon2.hash(randomUUID());

    // 마지막 OWNER 검증과 탈퇴 처리를 한 트랜잭션으로 묶어 동시 탈퇴 경쟁을 차단한다
    // (organizations.service.ts의 leaveMember와 같은 read-modify-write 경쟁).
    await this.prisma.$transaction(
      async (tx) => {
        const fresh = await tx.user.findFirst({
          where: { id: userId, deletedAt: null },
          select: { id: true },
        });
        if (!fresh) throw new NotFoundException();

        if (user.role === UserRole.THERAPIST) {
          await this.assertOwnedOrgsKeepAnOwner(userId, tx);
          await tx.organizationMembership.updateMany({
            where: { therapistProfile: { userId }, status: OrgMembershipStatus.ACTIVE },
            data: { status: OrgMembershipStatus.LEFT, leftAt: new Date() },
          });
          await tx.therapistProfile.updateMany({
            where: { userId },
            data: { licenseNumber: null },
          });
        }

        if (user.role === UserRole.PARENT) {
          // 아동은 기관 자산이라 남긴다 — 끊는 것은 연결과 이 학부모의 알림뿐이다.
          await tx.parentChildLink.deleteMany({ where: { parent: { userId } } });
          await tx.notification.deleteMany({ where: { parent: { userId } } });
          await tx.parentProfile.updateMany({ where: { userId }, data: { phoneNumber: null } });
        }

        await tx.user.update({
          where: { id: userId },
          data: {
            deletedAt: new Date(),
            email: `deleted+${userId}@${DELETED_EMAIL_DOMAIN}`,
            name: DELETED_USER_NAME,
            passwordHash: scrambledHash,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    this.logger.log(`deleteMe: user ${userId} (${user.role}) deleted`);
  }

  /**
   * 탈퇴하려는 치료사가 OWNER인 기관마다 소유자가 남는지 확인한다.
   *
   * 남은 멤버가 아무도 없으면 통과시킨다 — 1인 기관 치료사를 영원히 탈퇴 못 하게
   * 만들면 Apple 심사지침 5.1.1(v)를 위반한다. 넘겨받을 사람이 있는데 소유자가
   * 0명이 되는 경우만 막는다.
   */
  private async assertOwnedOrgsKeepAnOwner(
    userId: string,
    client: Prisma.TransactionClient,
  ): Promise<void> {
    const ownedOrgs = await client.organizationMembership.findMany({
      where: {
        therapistProfile: { userId },
        status: OrgMembershipStatus.ACTIVE,
        role: OrgMemberRole.OWNER,
      },
      select: { organizationId: true },
    });

    for (const { organizationId } of ownedOrgs) {
      const others = {
        organizationId,
        status: OrgMembershipStatus.ACTIVE,
        therapistProfile: { userId: { not: userId } },
      };
      const otherMembers = await client.organizationMembership.count({ where: others });
      if (otherMembers === 0) continue;

      const otherOwners = await client.organizationMembership.count({
        where: { ...others, role: OrgMemberRole.OWNER },
      });
      if (otherOwners === 0) {
        this.logger.warn(`deleteMe: user ${userId} is the last owner of org ${organizationId}`);
        throw new BadRequestException(
          '소유자로 있는 기관에 다른 멤버가 남아 있습니다. 소유자를 넘긴 뒤 탈퇴해주세요.',
        );
      }
    }
  }

  /**
   * 탈퇴 계정은 없는 것으로 취급한다. 인증 경로(JwtStrategy·login·refresh)가
   * 전부 이 두 메서드를 거치므로, 여기서 거르면 소프트 삭제가 인증상 실제 삭제와
   * 같아진다. `findUnique`가 아니라 `findFirst`인 것은 deletedAt이 unique 필드가
   * 아니기 때문이다.
   */
  async findById(id: string) {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }
}
