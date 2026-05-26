import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    throw new Error('Not implemented - Phase 3');
  }

  async markAsRead(_id: string) {
    throw new Error('Not implemented - Phase 3');
  }

  async markAllAsRead() {
    throw new Error('Not implemented - Phase 3');
  }
}
