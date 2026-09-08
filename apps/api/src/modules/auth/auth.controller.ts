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
import { ThrottlePolicy } from '../../common/throttle/throttle.policy.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('email/send-code')
  @ThrottlePolicy('sendEmailCode')
  @HttpCode(HttpStatus.OK)
  sendVerificationCode(
    @Body(new ZodValidationPipe(sendVerificationCodeSchema)) dto: SendVerificationCodeDto,
  ) {
    return this.authService.sendVerificationCode(dto);
  }

  @Post('email/verify-code')
  @ThrottlePolicy('verifyEmailCode')
  @HttpCode(HttpStatus.OK)
  verifyCode(@Body(new ZodValidationPipe(verifyCodeSchema)) dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto);
  }

  @Post('signup')
  @ThrottlePolicy('signup')
  signup(@Body(new ZodValidationPipe(signupSchema)) dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @ThrottlePolicy('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ThrottlePolicy('refresh')
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
