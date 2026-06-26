import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { ChildrenModule } from './modules/children/children.module.js';
import { InviteCodesModule } from './modules/invite-codes/invite-codes.module.js';
import { SchedulesModule } from './modules/schedules/schedules.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { OrganizationsModule } from './modules/organizations/organizations.module.js';
import { ReportModule } from './modules/report/report.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ChildrenModule,
    InviteCodesModule,
    SchedulesModule,
    NotificationsModule,
    ReportModule,
  ],
})
export class AppModule {}
