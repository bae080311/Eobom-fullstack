import { Module } from '@nestjs/common';
import { InviteCodesController } from './invite-codes.controller.js';
import { InviteCodesService } from './invite-codes.service.js';

@Module({
  controllers: [InviteCodesController],
  providers: [InviteCodesService],
})
export class InviteCodesModule {}
