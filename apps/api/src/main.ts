// Crypto polyfill must be imported before any other modules
import './crypto-polyfill';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Verify database connection before starting
  const prisma = app.get(PrismaService);
  try {
    await prisma.$connect();
    console.log('✅ Database connection established');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Database connection failed:', errorMessage);
    console.error('Please check your DATABASE_URL environment variable');
    process.exit(1);
  }

  
  // Use Winston logger
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);
  logger.log('✅ Database connection verified', 'Bootstrap');
  
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

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
  await app.listen(port);
  
  logger.log(`🚀 API running on http://localhost:${port}/api`, 'Bootstrap');
  logger.log(`📊 Metrics available at http://localhost:${port}/api/metrics`, 'Bootstrap');
}

bootstrap();