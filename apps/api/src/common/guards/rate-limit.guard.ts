import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createClient, RedisClientType } from 'redis';

/**
 * Rate Limit Configuration Interface
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Skip rate limiting (for admin routes) */
  skipRateLimit?: boolean;
}

/**
 * Metadata keys for rate limiting
 */
export const RATE_LIMIT_KEY = 'rateLimit';
export const SKIP_RATE_LIMIT_KEY = 'skipRateLimit';

/**
 * Decorator to set custom rate limit for a route
 * @example
 * @RateLimit({ maxRequests: 10, windowSeconds: 60 })
 */
export const RateLimit = (config: Omit<RateLimitConfig, 'skipRateLimit'>) => 
  SetMetadata(RATE_LIMIT_KEY, { ...config, skipRateLimit: false });

/**
 * Decorator to skip rate limiting for specific routes
 * @example
 * @SkipRateLimit()
 */
export const SkipRateLimit = () => 
  SetMetadata(SKIP_RATE_LIMIT_KEY, true);

/**
 * Rate Limiting Guard
 * 
 * Limits requests per user (authenticated) and per IP (unauthenticated)
 * Uses Redis to store counters with automatic TTL expiration
 * 
 * Default Limits:
 * - Authenticated users: 100 requests/minute per user
 * - Unauthenticated IPs: 20 requests/minute per IP
 * 
 * Custom limits can be set per route using @RateLimit() decorator
 * 
 * @example
 * // In controller
 * @RateLimit({ maxRequests: 10, windowSeconds: 60 })
 * @Get('expensive-operation')
 * async expensiveOperation() { ... }
 * 
 * @SkipRateLimit()
 * @Get('health')
 * async health() { ... }
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private redisClient: RedisClientType;
  private readonly defaultUserLimit = 100; // requests per minute
  private readonly defaultIpLimit = 20; // requests per minute
  private readonly defaultWindowSeconds = 60;

  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {
    this.initRedis();
  }

  /**
   * Initialize Redis connection
   */
  private async initRedis() {
    const redisHost = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const redisPort = this.configService.get<number>('REDIS_PORT') || 6379;
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    this.redisClient = createClient({
      socket: {
        host: redisHost,
        port: redisPort,
      },
      password: redisPassword,
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis connected for rate limiting');
    });

    try {
      await this.redisClient.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
    }
  }

  /**
   * Check if request is allowed based on rate limits
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if rate limiting is disabled globally
    const rateLimitEnabled = this.configService.get<boolean>('RATE_LIMIT_ENABLED') !== false;
    if (!rateLimitEnabled) {
      return true;
    }

    // Check for @SkipRateLimit() decorator
    const skipRateLimit = this.reflector.get<boolean>(SKIP_RATE_LIMIT_KEY, context.getHandler());
    if (skipRateLimit) {
      return true;
    }

    // Get custom rate limit config if set
    const config = this.reflector.get<RateLimitConfig>(RATE_LIMIT_KEY, context.getHandler());

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get user ID (if authenticated) or IP address
    const userId = request.user?.id;
    const ipAddress = this.getClientIp(request);

    // Determine rate limit key and limits
    const { key, maxRequests, windowSeconds } = this.getRateLimitConfig(
      userId,
      ipAddress,
      config,
    );

    try {
      // Check if Redis is connected
      if (!this.redisClient?.isOpen) {
        this.logger.warn('Redis not connected, allowing request');
        return true;
      }

      // Get current count
      const currentCount = await this.redisClient.get(key);
      const count = currentCount ? parseInt(currentCount, 10) : 0;

      // Check if limit exceeded
      if (count >= maxRequests) {
        // Get TTL for retry-after header
        const ttl = await this.redisClient.ttl(key);
        
        response.setHeader('X-RateLimit-Limit', maxRequests.toString());
        response.setHeader('X-RateLimit-Remaining', '0');
        response.setHeader('X-RateLimit-Reset', (Date.now() + ttl * 1000).toString());
        response.setHeader('Retry-After', ttl.toString());

        this.logger.warn(
          `Rate limit exceeded for ${userId ? `user:${userId}` : `ip:${ipAddress}`}`,
        );

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Rate limit exceeded. Try again in ${ttl} seconds.`,
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Increment counter
      if (count === 0) {
        // First request - set with TTL
        await this.redisClient.setEx(key, windowSeconds, '1');
      } else {
        // Subsequent request - increment
        await this.redisClient.incr(key);
      }

      // Set rate limit headers
      const remaining = maxRequests - count - 1;
      const ttl = await this.redisClient.ttl(key);
      
      response.setHeader('X-RateLimit-Limit', maxRequests.toString());
      response.setHeader('X-RateLimit-Remaining', remaining.toString());
      response.setHeader('X-RateLimit-Reset', (Date.now() + ttl * 1000).toString());

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error checking rate limit:', error);
      // Allow request on error (fail open)
      return true;
    }
  }

  /**
   * Get rate limit configuration (key, max requests, window)
   */
  private getRateLimitConfig(
    userId: string | undefined,
    ipAddress: string,
    customConfig?: RateLimitConfig,
  ): { key: string; maxRequests: number; windowSeconds: number } {
    // Use custom config if provided
    const maxRequests = customConfig?.maxRequests || 
      (userId ? this.defaultUserLimit : this.defaultIpLimit);
    const windowSeconds = customConfig?.windowSeconds || this.defaultWindowSeconds;

    // Create Redis key
    const identifier = userId ? `user:${userId}` : `ip:${ipAddress}`;
    const key = `rate_limit:${identifier}:${windowSeconds}`;

    return { key, maxRequests, windowSeconds };
  }

  /**
   * Extract client IP address from request
   */
  private getClientIp(request: any): string {
    // Check X-Forwarded-For header (for proxies/load balancers)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    // Check X-Real-IP header
    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return realIp;
    }

    // Fallback to socket IP
    return request.connection?.remoteAddress || 
           request.socket?.remoteAddress || 
           'unknown';
  }

  /**
   * Cleanup Redis connection on module destroy
   */
  async onModuleDestroy() {
    if (this.redisClient?.isOpen) {
      await this.redisClient.quit();
      this.logger.log('Redis connection closed');
    }
  }
}
