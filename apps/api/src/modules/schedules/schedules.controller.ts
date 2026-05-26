import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { SchedulesService } from './schedules.service.js';
import type { CreateScheduleDto, UpdateScheduleDto, ScheduleQueryDto } from '@eobom/shared';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findAll(@Query() query: ScheduleQueryDto) {
    return this.schedulesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedulesService.update(id, dto);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.schedulesService.cancel(id);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.schedulesService.confirm(id);
  }
}
