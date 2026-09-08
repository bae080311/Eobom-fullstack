import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

export type HealthStatus = 'ok' | 'degraded';

export interface HealthResult {
  status: HealthStatus;
  database: 'up' | 'down';
  uptimeSeconds: number;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 컨테이너 오케스트레이터가 부를 라이브니스/레디니스 프로브.
   *
   * DB까지 확인한다 — 프로세스만 살아 있고 DB가 끊긴 인스턴스로 트래픽이 흘러들면
   * 모든 요청이 500이 된다. 여기서 degraded를 돌려주면 로드밸런서가 빼낼 수 있다.
   */
  async check(): Promise<HealthResult> {
    const uptimeSeconds = Math.floor(process.uptime());

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up', uptimeSeconds };
    } catch (error) {
      this.logger.error('health: 데이터베이스 확인 실패', error);
      return { status: 'degraded', database: 'down', uptimeSeconds };
    }
  }
}
