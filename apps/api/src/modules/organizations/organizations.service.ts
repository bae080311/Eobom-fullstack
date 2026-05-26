import { Injectable } from '@nestjs/common';
import type {
  CreateOrganizationDto,
  OrganizationResponseDto,
  MemberResponseDto,
  RotateJoinCodeResponseDto,
} from '@eobom/shared';

// Phase 2에서 전체 구현 예정 (JWT 컨텍스트, Prisma, 멤버십 권한 검증)
@Injectable()
export class OrganizationsService {
  async create(_dto: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    throw new Error('Not implemented - Phase 2');
  }

  async findMine(): Promise<OrganizationResponseDto> {
    throw new Error('Not implemented - Phase 2');
  }

  async update(_orgId: string, _dto: Partial<CreateOrganizationDto>): Promise<OrganizationResponseDto> {
    throw new Error('Not implemented - Phase 2');
  }

  async rotateJoinCode(_orgId: string): Promise<RotateJoinCodeResponseDto> {
    throw new Error('Not implemented - Phase 2');
  }

  async findMembers(_orgId: string): Promise<MemberResponseDto[]> {
    throw new Error('Not implemented - Phase 2');
  }

  async updateMember(_orgId: string, _membershipId: string, _dto: unknown): Promise<MemberResponseDto> {
    throw new Error('Not implemented - Phase 2');
  }

  async leaveMember(_orgId: string, _membershipId: string): Promise<void> {
    throw new Error('Not implemented - Phase 2');
  }
}
