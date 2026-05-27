import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import {
  sendVerificationCodeSchema,
  verifyCodeSchema,
  signupSchema,
  loginSchema,
  type SendVerificationCodeDto,
  type VerifyCodeDto,
  type SignupDto,
  type LoginDto,
} from '@eobom/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('email/send-code')
  @HttpCode(HttpStatus.OK)
  sendVerificationCode(
    @Body(new ZodValidationPipe(sendVerificationCodeSchema)) dto: SendVerificationCodeDto,
  ) {
    return this.authService.sendVerificationCode(dto);
  }

  @Post('email/verify-code')
  @HttpCode(HttpStatus.OK)
  verifyCode(@Body(new ZodValidationPipe(verifyCodeSchema)) dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto);
  }

  @Post('signup')
  signup(@Body(new ZodValidationPipe(signupSchema)) dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: { refreshToken: string }) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout() {
    return this.authService.logout();
  }
}
