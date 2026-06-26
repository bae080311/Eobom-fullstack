import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { InviteCodesService } from './invite-codes.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { issueParentLinkCodeSchema, redeemInviteCodeSchema } from '@eobom/shared';
import type { IssueParentLinkCodeDto, RedeemInviteCodeDto, IUser } from '@eobom/shared';

@Controller('invite-codes')
@UseGuards(JwtAuthGuard)
export class InviteCodesController {
  constructor(private readonly inviteCodesService: InviteCodesService) {}

  @Post('parent-link')
  issueParentLink(
    @CurrentUser() user: IUser,
    @Body(new ZodValidationPipe(issueParentLinkCodeSchema)) dto: IssueParentLinkCodeDto,
  ) {
    return this.inviteCodesService.issueParentLink(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: IUser, @Query('childId') childId?: string) {
    return this.inviteCodesService.findAll(user.id, childId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.inviteCodesService.revoke(user.id, id);
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  redeem(
    @CurrentUser() user: IUser,
    @Body(new ZodValidationPipe(redeemInviteCodeSchema)) dto: RedeemInviteCodeDto,
  ) {
    return this.inviteCodesService.redeem(user.id, dto);
  }
}
