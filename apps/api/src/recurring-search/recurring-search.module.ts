import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RecurringSearchService } from './recurring-search.service';
import { RecurringSearchController } from './recurring-search.controller';
import { WebSearchAdapter } from './adapters/web-search.adapter';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Recurring Search Module
 * 
 * Handles scheduled web searches.
 * Search execution processing is handled by separate workers process.
 * 
 * Note: RecurringSearchProcessor is registered in WorkersModule
 */
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'recurring-search',
    }),
  ],
  controllers: [RecurringSearchController],
  providers: [RecurringSearchService, WebSearchAdapter],
  exports: [RecurringSearchService],
})
export class RecurringSearchModule {}
