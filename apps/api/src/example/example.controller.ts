import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RateLimit, SkipRateLimit } from '../common/guards/rate-limit.guard';

/**
 * Example Controller demonstrating rate limiting usage
 * 
 * This file shows how to use @RateLimit() and @SkipRateLimit() decorators
 * in your controllers.
 */
@Controller('example')
export class ExampleController {
  
  /**
   * Default rate limit (100 req/min for authenticated, 20 req/min for IPs)
   */
  @Get('default')
  async defaultRateLimit() {
    return {
      message: 'This endpoint uses default rate limits',
      limits: {
        authenticated: '100 requests per minute',
        unauthenticated: '20 requests per minute',
      },
    };
  }

  /**
   * Custom rate limit: 10 requests per minute
   */
  @RateLimit({ maxRequests: 10, windowSeconds: 60 })
  @Post('expensive')
  async expensiveOperation() {
    return {
      message: 'This is an expensive operation',
      rateLimit: '10 requests per minute',
    };
  }

  /**
   * Stricter rate limit: 5 requests per hour
   */
  @RateLimit({ maxRequests: 5, windowSeconds: 3600 })
  @Post('ai-generation')
  async aiGeneration() {
    return {
      message: 'AI generation request',
      rateLimit: '5 requests per hour',
    };
  }

  /**
   * Very strict: 1 request per day
   */
  @RateLimit({ maxRequests: 1, windowSeconds: 86400 })
  @Post('daily-report')
  async dailyReport() {
    return {
      message: 'Daily report generated',
      rateLimit: '1 request per day',
    };
  }

  /**
   * No rate limiting (health check)
   */
  @SkipRateLimit()
  @Get('health')
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * No rate limiting (webhook endpoint)
   */
  @SkipRateLimit()
  @Post('webhook')
  async webhook() {
    return {
      message: 'Webhook received',
      note: 'Webhooks should not be rate limited',
    };
  }
}
