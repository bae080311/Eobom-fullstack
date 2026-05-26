import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
import { InviteCodesService } from './invite-codes.service.js';
import type { IssueParentLinkCodeDto, RedeemInviteCodeDto } from '@eobom/shared';

@Controller('invite-codes')
export class InviteCodesController {
  constructor(private readonly inviteCodesService: InviteCodesService) {}

  @Post('parent-link')
  issueParentLink(@Body() dto: IssueParentLinkCodeDto) {
    return this.inviteCodesService.issueParentLink(dto);
  }

  @Get()
  findAll(@Query('childId') childId?: string) {
    return this.inviteCodesService.findAll(childId);
  }

  @Delete(':id')
  revoke(@Param('id') id: string) {
    return this.inviteCodesService.revoke(id);
  }

  @Post('redeem')
  redeem(@Body() dto: RedeemInviteCodeDto) {
    return this.inviteCodesService.redeem(dto);
  }
}
