import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { HealthService } from './health.service.js';

@Controller('health')
// 프로브는 주기적으로 계속 들어온다. 레이트 리밋에 걸려 인스턴스가
// 죽은 것으로 오판되면 안 된다.
@SkipThrottle()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * DB가 끊기면 503을 반환해야 로드밸런서가 이 인스턴스를 빼낸다.
   * 상태 코드를 몸통 값에 따라 바꿔야 해서 @Res를 쓴다.
   */
  @Get()
  async check(@Res() res: Response): Promise<void> {
    const result = await this.healthService.check();
    const status = result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    res.status(status).json(result);
  }
}
