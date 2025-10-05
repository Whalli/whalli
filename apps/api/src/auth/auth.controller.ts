import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('me')
  // @UseGuards(BetterAuthGuard) // Custom guard for Better Auth integration
  async getProfile() {
    // Implementation would get user from Better Auth token
    return { message: 'Profile endpoint - integrate with Better Auth' };
  }

  @Post('refresh')
  async refresh() {
    // Refresh token logic with Better Auth
    return { message: 'Refresh endpoint - integrate with Better Auth' };
  }
}