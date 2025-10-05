import { NestFactory } from '@nestjs/core';
import { WorkersModule } from './workers.module';
import { Logger } from '@nestjs/common';

/**
 * Workers Process Bootstrap
 * 
 * Separate process dedicated to processing BullMQ jobs:
 * - Voice Transcription (Whisper API)
 * - Recurring Search Execution
 * 
 * This keeps the main API server responsive by offloading
 * CPU-intensive and long-running tasks to dedicated workers.
 * 
 * Usage:
 *   npm run build
 *   node dist/workers/main.js
 */
async function bootstrap() {
  const logger = new Logger('WorkersBootstrap');

  try {
    const app = await NestFactory.createApplicationContext(WorkersModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    logger.log('🚀 BullMQ Workers started successfully');
    logger.log('📋 Active workers:');
    logger.log('  - Voice Transcription Worker (queue: voice-transcription)');
    logger.log('  - Recurring Search Worker (queue: recurring-search)');
    logger.log('');
    logger.log('⏳ Workers are now processing jobs...');

    // Keep process alive
    process.on('SIGTERM', async () => {
      logger.log('SIGTERM received, shutting down workers...');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('SIGINT received, shutting down workers...');
      await app.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start workers:', error);
    process.exit(1);
  }
}

bootstrap();
