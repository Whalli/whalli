import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'your-secret-key-change-in-env',
        ),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // Only provide OAuth strategies if credentials are configured
    {
      provide: GoogleStrategy,
      useFactory: (configService: ConfigService, authService: AuthService) => {
        if (configService.get<string>('GOOGLE_CLIENT_ID')) {
          return new GoogleStrategy(configService, authService);
        }
        return null;
      },
      inject: [ConfigService, AuthService],
    },
    {
      provide: GitHubStrategy,
      useFactory: (configService: ConfigService, authService: AuthService) => {
        if (configService.get<string>('GITHUB_CLIENT_ID')) {
          return new GitHubStrategy(configService, authService);
        }
        return null;
      },
      inject: [ConfigService, AuthService],
    },
    PrismaService,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}