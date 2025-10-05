import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { ChatModule } from './chat/chat.module';
import { FilesModule } from './files/files.module';
import { BillingModule } from './billing/billing.module';
import { VoiceModule } from './voice/voice.module';
import { MindmapModule } from './mindmap/mindmap.module';
import { RecurringSearchModule } from './recurring-search/recurring-search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ModelCatalogModule } from './model-catalog/model-catalog.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { HealthController } from './health/health.controller';
import { winstonConfig } from './common/logger/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    WinstonModule.forRoot(winstonConfig),
    MetricsModule,
    NotificationsModule,
    ModelCatalogModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    ChatModule,
    FilesModule,
    BillingModule,
    VoiceModule,
    MindmapModule,
    RecurringSearchModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}