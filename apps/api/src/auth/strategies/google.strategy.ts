import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private configService: ConfigService;
  private authService: AuthService;

  constructor(configService: ConfigService, authService: AuthService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID', 'dummy');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET', 'dummy');

    super({
      clientID,
      clientSecret,
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3001/auth/google/callback',
      ),
      scope: ['profile', 'email'],
    });

    this.configService = configService;
    this.authService = authService;

    if (!configService.get<string>('GOOGLE_CLIENT_ID')) {
      console.warn(
        '[GoogleStrategy] Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.',
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const user = await this.authService.validateOrCreateOAuthUser({
        provider: 'google',
        providerId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        image: profile.photos[0]?.value,
        accessToken,
        refreshToken,
      });

      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}
