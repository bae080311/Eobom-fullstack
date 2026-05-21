import { Controller, Post, Body } from '@nestjs/common';
import { InviteCodesService } from './invite-codes.service';
import type { CreateInviteCodeDto, UseInviteCodeDto } from '@eobom/shared';

@Controller('invite-codes')
export class InviteCodesController {
  constructor(private readonly inviteCodesService: InviteCodesService) {}

  @Post()
  create(@Body() dto: CreateInviteCodeDto) {
    return this.inviteCodesService.create(dto);
  }

  @Post('use')
  use(@Body() dto: UseInviteCodeDto) {
    return this.inviteCodesService.use(dto);
  }
}
