import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { VoiceService } from '../voice/voice.service';
import { VoiceTranscriptionProcessor } from '../voice/voice.processor';
import { RecurringSearchService } from '../recurring-search/recurring-search.service';
import { RecurringSearchProcessor } from '../recurring-search/recurring-search.processor';
import { WebSearchAdapter } from '../recurring-search/adapters/web-search.adapter';
import { winstonConfig } from '../common/logger/logger.config';

/**
 * Workers Module
 * 
 * Separate module for BullMQ workers that runs in a dedicated process.
 * This improves performance by offloading CPU-intensive tasks from the main API server.
 * 
 * Includes:
 * - Voice Transcription Worker (Whisper API calls)
 * - Recurring Search Worker (Web search execution)
 * 
 * Run separately: node dist/workers/main.js
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot(winstonConfig),
    PrismaModule,
    // BullMQ connection (workers only, no queue registration)
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
    // Register queues for workers
    BullModule.registerQueue(
      { name: 'voice-transcription' },
      { name: 'recurring-search' },
    ),
  ],
  providers: [
    // Voice transcription
    VoiceService,
    VoiceTranscriptionProcessor,
    
    // Recurring search
    RecurringSearchService,
    RecurringSearchProcessor,
    WebSearchAdapter,
  ],
})
export class WorkersModule {}
