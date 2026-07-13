import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller.js';
import { SchedulesService } from './schedules.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [NotificationsModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
