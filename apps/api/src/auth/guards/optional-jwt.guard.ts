import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Authentication Guard
 * Use with @UseGuards(OptionalJwtGuard) for routes that work with or without auth
 * If Authorization header is present, validates JWT. If absent, allows request.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Always return user (may be undefined) instead of throwing
    return user;
  }
}