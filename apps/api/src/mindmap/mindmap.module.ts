import { Module } from '@nestjs/common';
import { MindmapService } from './mindmap.service';
import { MindmapController } from './mindmap.controller';
import { MindmapGateway } from './mindmap.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MindmapController],
  providers: [MindmapService, MindmapGateway],
  exports: [MindmapService],
})
export class MindmapModule {}
