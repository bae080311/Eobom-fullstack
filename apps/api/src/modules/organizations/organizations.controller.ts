import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateMembershipSchema,
} from '@eobom/shared';
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  UpdateMembershipDto,
  IUser,
} from '@eobom/shared';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(
    @CurrentUser() user: IUser,
    @Body(new ZodValidationPipe(createOrganizationSchema)) dto: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(user.id, dto);
  }

  @Get('me')
  findMine(@CurrentUser() user: IUser) {
    return this.organizationsService.findMine(user.id);
  }

  @Patch(':orgId')
  update(
    @CurrentUser() user: IUser,
    @Param('orgId') orgId: string,
    @Body(new ZodValidationPipe(updateOrganizationSchema)) dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(user.id, orgId, dto);
  }

  @Post(':orgId/join-code\\:rotate')
  @HttpCode(HttpStatus.OK)
  rotateJoinCode(@CurrentUser() user: IUser, @Param('orgId') orgId: string) {
    return this.organizationsService.rotateJoinCode(user.id, orgId);
  }

  @Get(':orgId/members')
  findMembers(@CurrentUser() user: IUser, @Param('orgId') orgId: string) {
    return this.organizationsService.findMembers(user.id, orgId);
  }

  @Patch(':orgId/members/:membershipId')
  updateMember(
    @CurrentUser() user: IUser,
    @Param('orgId') orgId: string,
    @Param('membershipId') membershipId: string,
    @Body(new ZodValidationPipe(updateMembershipSchema)) dto: UpdateMembershipDto,
  ) {
    return this.organizationsService.updateMember(user.id, orgId, membershipId, dto);
  }

  @Post(':orgId/members/:membershipId\\:leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  leaveMember(
    @CurrentUser() user: IUser,
    @Param('orgId') orgId: string,
    @Param('membershipId') membershipId: string,
  ) {
    return this.organizationsService.leaveMember(user.id, orgId, membershipId);
  }
}
