import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { ThrottlePolicy } from '../../common/throttle/throttle.policy.js';
import { deleteAccountSchema, updateProfileSchema } from '@eobom/shared';
import type { DeleteAccountDto, IUser, UpdateProfileDto } from '@eobom/shared';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: IUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @CurrentUser() user: IUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
  ) {
    return this.usersService.updateMe(user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ThrottlePolicy('deleteAccount')
  @UseGuards(JwtAuthGuard)
  deleteMe(
    @CurrentUser() user: IUser,
    @Body(new ZodValidationPipe(deleteAccountSchema)) dto: DeleteAccountDto,
  ) {
    return this.usersService.deleteMe(user.id, dto);
  }
}
