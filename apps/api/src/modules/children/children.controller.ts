import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChildrenService } from './children.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { createChildSchema, updateChildSchema, setPrimaryTherapistSchema } from '@eobom/shared';
import type { IUser, CreateChildDto, UpdateChildDto, SetPrimaryTherapistDto } from '@eobom/shared';

@Controller('children')
@UseGuards(JwtAuthGuard)
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Get()
  findAll(@CurrentUser() user: IUser) {
    return this.childrenService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: IUser) {
    return this.childrenService.findOne(id, user);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createChildSchema)) dto: CreateChildDto,
    @CurrentUser() user: IUser,
  ) {
    return this.childrenService.create(dto, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateChildSchema)) dto: UpdateChildDto,
    @CurrentUser() user: IUser,
  ) {
    return this.childrenService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: IUser) {
    return this.childrenService.remove(id, user.id);
  }

  @Post(':id/primary-therapist')
  setPrimaryTherapist(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setPrimaryTherapistSchema)) dto: SetPrimaryTherapistDto,
    @CurrentUser() user: IUser,
  ) {
    return this.childrenService.setPrimaryTherapist(id, dto, user.id);
  }
}
