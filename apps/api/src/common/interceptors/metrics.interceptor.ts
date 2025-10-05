import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics/metrics.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly metricsService: MetricsService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const startTime = Date.now();

    // Log incoming request
    this.logger.info('Incoming request', {
      method,
      url,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000; // Convert to seconds
          const statusCode = response.statusCode;

          // Record metrics
          this.metricsService.recordHttpRequest(
            method,
            this.extractRoute(url),
            statusCode,
            duration,
          );

          // Log successful response
          this.logger.info('Request completed', {
            method,
            url,
            statusCode,
            duration: `${duration.toFixed(3)}s`,
            timestamp: new Date().toISOString(),
          });
        },
        error: (error) => {
          const duration = (Date.now() - startTime) / 1000;
          const statusCode = error.status || 500;

          // Record metrics
          this.metricsService.recordHttpRequest(
            method,
            this.extractRoute(url),
            statusCode,
            duration,
          );

          // Log error
          this.logger.error('Request failed', {
            method,
            url,
            statusCode,
            duration: `${duration.toFixed(3)}s`,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }

  /**
   * Extract route pattern from URL (e.g., /chat/123 -> /chat/:id)
   */
  private extractRoute(url: string): string {
    // Remove query parameters
    const path = url.split('?')[0];

    // Replace UUIDs and numeric IDs with parameter placeholders
    return path
      .replace(
        /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        '/:id',
      ) // UUIDs
      .replace(/\/\d+/g, '/:id'); // Numeric IDs
  }
}
