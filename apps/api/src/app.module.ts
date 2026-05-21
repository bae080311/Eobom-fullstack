import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ChildrenModule } from './modules/children/children.module';
import { InviteCodesModule } from './modules/invite-codes/invite-codes.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ChildrenModule,
    InviteCodesModule,
    SchedulesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
