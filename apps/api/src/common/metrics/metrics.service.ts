import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  public readonly registry: Registry;

  // HTTP Metrics
  private readonly httpRequestsTotal: Counter;
  private readonly httpRequestDuration: Histogram;

  // AI Model Metrics
  private readonly aiModelRequestsTotal: Counter;
  private readonly aiModelRequestDuration: Histogram;

  // Cache Metrics
  private readonly cacheHitsTotal: Counter;
  private readonly cacheMissesTotal: Counter;
  private readonly cacheHitRate: Gauge;

  // Active connections
  private readonly activeConnections: Gauge;

  constructor() {
    // Create a new registry
    this.registry = new Registry();

    // Set default labels
    this.registry.setDefaultLabels({
      app: 'whalli-api',
    });

    // HTTP Request Total Counter
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    // HTTP Request Duration Histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    // AI Model Requests Counter
    this.aiModelRequestsTotal = new Counter({
      name: 'ai_model_requests_total',
      help: 'Total number of requests per AI model',
      labelNames: ['model', 'provider', 'status'],
      registers: [this.registry],
    });

    // AI Model Request Duration
    this.aiModelRequestDuration = new Histogram({
      name: 'ai_model_request_duration_seconds',
      help: 'Duration of AI model requests in seconds',
      labelNames: ['model', 'provider'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.registry],
    });

    // Cache Hits Counter
    this.cacheHitsTotal = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    // Cache Misses Counter
    this.cacheMissesTotal = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    // Cache Hit Rate Gauge
    this.cacheHitRate = new Gauge({
      name: 'cache_hit_rate',
      help: 'Current cache hit rate (0-1)',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    // Active Connections Gauge
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['type'],
      registers: [this.registry],
    });

    // Collect default metrics (CPU, memory, etc.)
    const collectDefaultMetrics = require('prom-client').collectDefaultMetrics;
    collectDefaultMetrics({ register: this.registry });
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ) {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });

    this.httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode,
      },
      duration,
    );
  }

  /**
   * Record AI model request metrics
   */
  recordAiModelRequest(
    model: string,
    provider: string,
    status: 'success' | 'error',
    duration: number,
  ) {
    this.aiModelRequestsTotal.inc({
      model,
      provider,
      status,
    });

    this.aiModelRequestDuration.observe(
      {
        model,
        provider,
      },
      duration,
    );
  }

  /**
   * Record cache hit
   */
  recordCacheHit(cacheType: string = 'default') {
    this.cacheHitsTotal.inc({ cache_type: cacheType });
    this.updateCacheHitRate(cacheType);
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(cacheType: string = 'default') {
    this.cacheMissesTotal.inc({ cache_type: cacheType });
    this.updateCacheHitRate(cacheType);
  }

  /**
   * Update cache hit rate
   */
  private async updateCacheHitRate(cacheType: string) {
    const hits = await this.cacheHitsTotal
      .get()
      .then((metric) => {
        const value = metric.values.find(
          (v) => v.labels.cache_type === cacheType,
        );
        return value?.value || 0;
      })
      .catch(() => 0);

    const misses = await this.cacheMissesTotal
      .get()
      .then((metric) => {
        const value = metric.values.find(
          (v) => v.labels.cache_type === cacheType,
        );
        return value?.value || 0;
      })
      .catch(() => 0);

    const total = hits + misses;
    const hitRate = total > 0 ? hits / total : 0;

    this.cacheHitRate.set({ cache_type: cacheType }, hitRate);
  }

  /**
   * Set active connections
   */
  setActiveConnections(type: string, count: number) {
    this.activeConnections.set({ type }, count);
  }

  /**
   * Increment active connections
   */
  incrementActiveConnections(type: string) {
    this.activeConnections.inc({ type });
  }

  /**
   * Decrement active connections
   */
  decrementActiveConnections(type: string) {
    this.activeConnections.dec({ type });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics as JSON (for debugging)
   */
  async getMetricsJson(): Promise<any> {
    return this.registry.getMetricsAsJSON();
  }

  /**
   * Reset all metrics (useful for testing)
   */
  resetMetrics() {
    this.registry.resetMetrics();
  }
}
