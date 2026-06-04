import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '@eobom/shared';
import type { UpdateProfileDto } from '@eobom/shared';
import { PrismaService } from '../../database/prisma.service.js';

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

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
