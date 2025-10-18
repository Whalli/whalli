import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, SignUpDto, SignInDto } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  /**
   * Health check endpoint
   */
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * Sign up with email and password
   * POST /auth/signup
   * Body: { email: string, password: string, name?: string }
   */
  @Post('signup')
  async signUp(@Body() data: SignUpDto, @Res({ passthrough: true }) res: Response) {
    if (!data.email || !data.password) {
      throw new BadRequestException('Email and password are required');
    }

    const result = await this.authService.signUp(data);
    
    // Set httpOnly cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    
    // Return user data only (no tokens in response body)
    return { user: result.user };
  }

  /**
   * Sign in with email and password
   * POST /auth/signin
   * Body: { email: string, password: string }
   */
  @Post('signin')
  async signIn(@Body() data: SignInDto, @Res({ passthrough: true }) res: Response) {
    if (!data.email || !data.password) {
      throw new BadRequestException('Email and password are required');
    }

    const result = await this.authService.signIn(data);
    
    // Set httpOnly cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    
    // Return user data only (no tokens in response body)
    return { user: result.user };
  }

  /**
   * Helper method to set auth cookies
   */
  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Access token cookie (15 minutes)
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });
    
    // Refresh token cookie (7 days)
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  /**
   * Get current user profile (protected)
   * GET /auth/profile
   * Header: Authorization: Bearer <token>
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    const user = (req as any).user;

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const fullUser = await this.authService.findUserById(user.id);
    return { user: fullUser };
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   * Reads refreshToken from httpOnly cookie
   */
  @Post('refresh')
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refreshToken(refreshToken);
    
    // Update cookies with new tokens
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    
    return { message: 'Token refreshed successfully' };
  }

  /**
   * Google OAuth redirect
   * GET /auth/google
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // This route triggers passport-google-oauth20 strategy
  }

  /**
   * Google OAuth callback
   * GET /auth/google/callback
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = (req as any).user;

    if (!user) {
      return res.redirect('/login?error=auth_failed');
    }

    // Return tokens as redirect with query params or JSON
    return res.json({
      user,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    });
  }

  /**
   * GitHub OAuth redirect
   * GET /auth/github
   */
  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {
    // This route triggers passport-github2 strategy
  }

  /**
   * GitHub OAuth callback
   * GET /auth/github/callback
   */
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = (req as any).user;

    if (!user) {
      return res.redirect('/login?error=auth_failed');
    }

    // Return tokens as redirect with query params or JSON
    return res.json({
      user,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    });
  }

  /**
   * Sign out - clears httpOnly cookies
   * POST /auth/logout
   */
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    // Clear auth cookies
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    
    return {
      message: 'Logged out successfully',
    };
  }
}