import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { IUser } from '@eobom/shared';
import type { CreateScheduleDto, UpdateScheduleDto, ScheduleQueryDto } from '@eobom/shared';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findAll(@Query() query: ScheduleQueryDto, @CurrentUser() user: IUser) {
    return this.schedulesService.findAll(query, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: IUser) {
    return this.schedulesService.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateScheduleDto, @CurrentUser() user: IUser) {
    return this.schedulesService.create(dto, user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto, @CurrentUser() user: IUser) {
    return this.schedulesService.update(id, dto, user.id);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @CurrentUser() user: IUser) {
    return this.schedulesService.cancel(id, user.id);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() user: IUser) {
    return this.schedulesService.confirm(id, user.id);
  }

  @Post(':id/acknowledge')
  acknowledge(@Param('id') id: string, @CurrentUser() user: IUser) {
    return this.schedulesService.acknowledge(id, user);
  }
}
