// Crypto polyfill must be imported before any other modules
import './crypto-polyfill';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  try {
    console.log('[BOOTSTRAP] Starting...');
    
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
    });

    console.log('[BOOTSTRAP] NestFactory created, configuring...');

    // Get logger early
    let logger;
    try {
      logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
      app.useLogger(logger);
      console.log('[BOOTSTRAP] Logger configured');
    } catch (e) {
      console.log('[BOOTSTRAP] Logger not available, using console only');
      logger = null;
    }
    
    // Enable CORS
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });

    // Enable cookie parser
    app.use(cookieParser());

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Global prefix
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3001;
    
    console.log(`[BOOTSTRAP] Starting to listen on port ${port}...`);
    
    await app.listen(port);
    
    console.log(`[BOOTSTRAP] ✅ SUCCESS! API running on http://localhost:${port}/api`);
    
    if (logger) {
      logger.log(`🚀 API running on http://localhost:${port}/api`, 'Bootstrap');
    }
  } catch (error) {
    console.error('[BOOTSTRAP ERROR]', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

bootstrap();
