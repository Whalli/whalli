import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { PresetModule } from './presets/preset.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) * 1000,
      limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    }]),
    PrismaModule,
    AuthModule,
    ChatModule,
    PresetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
