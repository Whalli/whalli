import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  private configService: ConfigService;
  private authService: AuthService;

  constructor(configService: ConfigService, authService: AuthService) {
    const clientID = configService.get<string>('GITHUB_CLIENT_ID', 'dummy');
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET', 'dummy');

    super({
      clientID,
      clientSecret,
      callbackURL: configService.get<string>(
        'GITHUB_CALLBACK_URL',
        'http://localhost:3001/auth/github/callback',
      ),
      scope: ['user:email'],
    });

    this.configService = configService;
    this.authService = authService;

    if (!configService.get<string>('GITHUB_CLIENT_ID')) {
      console.warn(
        '[GitHubStrategy] GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to enable.',
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
        provider: 'github',
        providerId: profile.id.toString(),
        email: profile.emails[0]?.value || profile.username + '@github.local',
        name: profile.displayName || profile.username,
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
