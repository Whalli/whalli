import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * GET /metrics
   * Returns metrics in Prometheus format
   */
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }

  /**
   * GET /metrics/json
   * Returns metrics in JSON format (for debugging)
   */
  @Get('json')
  async getMetricsJson(): Promise<any> {
    return this.metricsService.getMetricsJson();
  }
}
