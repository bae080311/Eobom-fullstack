import { Module } from '@nestjs/common';
import { ReportController } from './report.controller.js';
import { ReportService } from './report.service.js';
import { OllamaService } from './ollama.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [NotificationsModule],
  controllers: [ReportController],
  providers: [ReportService, OllamaService],
})
export class ReportModule {}
