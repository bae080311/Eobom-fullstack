import { Controller, Post, Get, Patch, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { OrganizationsService } from './organizations.service.js';
import type { CreateOrganizationDto } from '@eobom/shared';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto);
  }

  @Get('me')
  findMine() {
    return this.organizationsService.findMine();
  }

  @Patch(':orgId')
  update(@Param('orgId') orgId: string, @Body() dto: Partial<CreateOrganizationDto>) {
    return this.organizationsService.update(orgId, dto);
  }

  @Post(':orgId/join-code\\:rotate')
  @HttpCode(HttpStatus.OK)
  rotateJoinCode(@Param('orgId') orgId: string) {
    return this.organizationsService.rotateJoinCode(orgId);
  }

  @Get(':orgId/members')
  findMembers(@Param('orgId') orgId: string) {
    return this.organizationsService.findMembers(orgId);
  }

  @Patch(':orgId/members/:membershipId')
  updateMember(
    @Param('orgId') orgId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: unknown,
  ) {
    return this.organizationsService.updateMember(orgId, membershipId, dto);
  }

  @Post(':orgId/members/:membershipId\\:leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  leaveMember(@Param('orgId') orgId: string, @Param('membershipId') membershipId: string) {
    return this.organizationsService.leaveMember(orgId, membershipId);
  }
}
