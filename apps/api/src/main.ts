// Sentry 계측은 다른 어떤 모듈보다 먼저 올라와야 한다. import 순서가 곧 계측 순서다.
import './instrument.js';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // 프록시·로드밸런서 뒤에 배포하면 Express가 보는 req.ip가 전부 프록시 IP다.
  // 그대로 두면 레이트 리밋이 모든 사용자를 한 버킷에 넣어, 한 명이 전체를 잠글 수 있다.
  // 신뢰할 홉 수를 TRUST_PROXY로 명시한다(예: '1'). 미설정이면 끈 상태 — 로컬 기본값.
  const trustProxy = process.env.TRUST_PROXY;
  if (trustProxy) {
    const hops = Number(trustProxy);
    app.set('trust proxy', Number.isNaN(hops) ? trustProxy : hops);
    logger.log(`trust proxy: ${trustProxy}`);
  }

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('이어봄 API')
      .setDescription('치료 스케줄 공유 서비스 API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    logger.log(`Swagger: http://localhost:${process.env.API_PORT || 3001}/docs`);
  }

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  logger.log(`API 서버 실행 중: http://localhost:${port}/api`);
}
bootstrap();
