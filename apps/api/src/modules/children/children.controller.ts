import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ChildrenService } from './children.service';
import type { CreateChildDto, UpdateChildDto } from '@eobom/shared';

@Controller('children')
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Get()
  findAll() {
    return this.childrenService.findAll();
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
