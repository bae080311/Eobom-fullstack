import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { IssueParentLinkCodeDto, RedeemInviteCodeDto } from '@eobom/shared';

// Phase 2에서 전체 구현 예정
@Injectable()
export class InviteCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async issueParentLink(_dto: IssueParentLinkCodeDto) {
    throw new Error('Not implemented - Phase 2');
  }

  async findAll(_childId?: string) {
    throw new Error('Not implemented - Phase 2');
  }

  async revoke(_id: string) {
    throw new Error('Not implemented - Phase 2');
  }

  async redeem(_dto: RedeemInviteCodeDto) {
    throw new Error('Not implemented - Phase 2');
  }
}
