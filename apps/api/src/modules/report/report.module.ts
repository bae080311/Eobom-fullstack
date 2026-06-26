import { Module } from '@nestjs/common';
import { ReportController } from './report.controller.js';
import { ReportService } from './report.service.js';
import { OllamaService } from './ollama.service.js';

@Module({
  controllers: [ReportController],
  providers: [ReportService, OllamaService],
})
export class ReportModule {}
