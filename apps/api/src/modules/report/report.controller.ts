import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { generateReportSchema } from '@eobom/shared';
import type { GenerateReportDto, IUser } from '@eobom/shared';

@Controller('schedules/:scheduleId/report')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  generate(
    @Param('scheduleId') scheduleId: string,
    @CurrentUser() user: IUser,
    @Body(new ZodValidationPipe(generateReportSchema)) dto: GenerateReportDto,
  ) {
    return this.reportService.generate(scheduleId, user, dto);
  }

  @Get()
  findOne(@Param('scheduleId') scheduleId: string, @CurrentUser() user: IUser) {
    return this.reportService.findOne(scheduleId, user);
  }
}
