import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('데이터베이스 연결 완료');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('데이터베이스 연결 종료');
  }
}
