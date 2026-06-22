import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ChildrenService } from './children.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { IUser, CreateChildDto, UpdateChildDto } from '@eobom/shared';

@Controller('children')
@UseGuards(JwtAuthGuard)
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Get()
  findAll(@CurrentUser() user: IUser) {
    return this.childrenService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.childrenService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateChildDto) {
    return this.childrenService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChildDto) {
    return this.childrenService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.childrenService.remove(id);
  }
}
