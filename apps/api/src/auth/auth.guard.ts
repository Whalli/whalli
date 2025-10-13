import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * AuthGuard validates Better-Auth sessions from the web app
 * 
 * The guard checks for session tokens in:
 * 1. Authorization header (Bearer token)
 * 2. Cookies (better-auth.session_token)
 * 
 * It validates the session by calling the Better-Auth session endpoint
 * and attaches the user object to the request.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly AUTH_API_URL = process.env.AUTH_API_URL || 'http://localhost:3000';

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromRequest(request);

    console.log('[AuthGuard] AUTH_API_URL:', this.AUTH_API_URL);
    console.log('[AuthGuard] Token found:', !!token);

    if (!token) {
      console.log('[AuthGuard] No token found in request');
      throw new UnauthorizedException('No authentication token found');
    }

    try {
      // Verify session with Better-Auth API
      const user = await this.validateSession(token, request.headers.cookie);
      
      // Attach user to request for use in controllers
      request['user'] = user;
      
      console.log('[AuthGuard] Authentication successful for user:', user.id);
      return true;
    } catch (error) {
      console.log('[AuthGuard] Authentication failed:', error instanceof Error ? error.message : String(error));
      throw new UnauthorizedException('Invalid or expired session');
    }
  }

  /**
   * Extract session token from Authorization header or cookies
   */
  private extractTokenFromRequest(request: Request): string | null {
    // Check Authorization header first (Bearer token)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookies for session token
    const cookies = request.headers.cookie;
    if (cookies) {
      const sessionCookie = cookies
        .split(';')
        .find(c => c.trim().startsWith('better-auth.session_token='));
      
      if (sessionCookie) {
        return sessionCookie.split('=')[1];
      }
    }

    return null;
  }

  /**
   * Validate session by calling Better-Auth session endpoint
   */
  private async validateSession(token: string, cookies?: string): Promise<any> {
    try {
      const sessionUrl = `${this.AUTH_API_URL}/api/auth/session`;
      console.log('[AuthGuard] Validating session at:', sessionUrl);

      const response = await fetch(sessionUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Pass cookies if available (for cookie-based auth)
          ...(cookies && { Cookie: cookies }),
          // Or pass as Authorization header
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[AuthGuard] Session validation response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('[AuthGuard] Session validation error:', errorText);
        throw new Error(`Session validation failed: ${response.status}`);
      }

      const sessionData: any = await response.json();
      console.log('[AuthGuard] Session data received:', !!sessionData.user);
      
      // Better-Auth returns { session, user } structure
      if (!sessionData.user) {
        throw new Error('No user in session');
      }

      return sessionData.user;
    } catch (error) {
      console.log('[AuthGuard] Session validation exception:', error instanceof Error ? error.message : String(error));
      throw new UnauthorizedException('Failed to validate session');
    }
  }
}

/**
 * Custom decorator to extract user from request
 * Usage: @CurrentUser() user: User
 */
import { createParamDecorator, ExecutionContext as ExecContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
