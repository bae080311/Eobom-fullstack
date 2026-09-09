import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { THROTTLE_POLICIES, resolveThrottleEnabled } from './common/throttle/throttle.policy.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { ChildrenModule } from './modules/children/children.module.js';
import { InviteCodesModule } from './modules/invite-codes/invite-codes.module.js';
import { SchedulesModule } from './modules/schedules/schedules.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { OrganizationsModule } from './modules/organizations/organizations.module.js';
import { ReportModule } from './modules/report/report.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    // Sentry 문서 권장대로 첫 번째로 둔다.
    // SENTRY_DSN이 없으면 instrument.ts가 init을 건너뛰므로 전부 no-op이 된다.
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    // 리밋 값 자체는 throttle.policy.ts의 상수다(데코레이터가 .env보다 먼저 평가되므로).
    // 환경변수로는 끄기만 제어한다 — e2e는 같은 IP에서 로그인·가입을 반복한다.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const enabled = resolveThrottleEnabled(config.get<string>('THROTTLE_ENABLED'));
        return {
          throttlers: [THROTTLE_POLICIES.default],
          skipIf: () => !enabled,
          // 기본 문구가 'ThrottlerException: Too Many Requests'라 다른 응답과 어긋난다.
          // 남은 대기 시간은 Retry-After 헤더로 이미 내려간다.
          errorMessage: '요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.',
        };
      },
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ChildrenModule,
    InviteCodesModule,
    SchedulesModule,
    NotificationsModule,
    ReportModule,
    HealthModule,
  ],
  providers: [
    // 500대 예외만 Sentry로 보내고(HttpException 4xx는 예상된 에러로 걸러진다)
    // 응답은 BaseExceptionFilter에 위임하므로 기존 응답 형식이 그대로 유지된다.
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // 성공 응답을 { data: ... }로 통일한다 (레이어 5 §5.1).
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
