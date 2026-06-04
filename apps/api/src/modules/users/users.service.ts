import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

    if (dto.name !== undefined) {
      await this.prisma.user.update({ where: { id: userId }, data: { name: dto.name } });
    }

    if (user.role === UserRole.THERAPIST && dto.licenseNumber !== undefined) {
      await this.prisma.therapistProfile.upsert({
        where: { userId },
        update: { licenseNumber: dto.licenseNumber },
        create: { userId, licenseNumber: dto.licenseNumber },
      });
    }

    if (user.role === UserRole.PARENT && dto.phoneNumber !== undefined) {
      await this.prisma.parentProfile.upsert({
        where: { userId },
        update: { phoneNumber: dto.phoneNumber },
        create: { userId, phoneNumber: dto.phoneNumber },
      });
    }

    this.logger.log(`User ${userId} updated profile`);
    return this.getMe(userId);
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
