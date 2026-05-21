import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { CreateInviteCodeDto, UseInviteCodeDto } from '@eobom/shared';

@Injectable()
export class InviteCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(_dto: CreateInviteCodeDto) {
    throw new Error('Not implemented - Phase 3');
  }

  async use(_dto: UseInviteCodeDto) {
    throw new Error('Not implemented - Phase 3');
  }
}
