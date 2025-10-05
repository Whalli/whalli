# Monitoring & Observability - Quick Reference

**Status**: ✅ Fully Integrated | **Date**: 2025-10-04

---

## 🎯 What's Implemented

### 1. **Winston Logger** (JSON Output)
- **Location**: `src/common/logger/logger.config.ts`
- **Transports**: Console (JSON), `logs/error.log`, `logs/combined.log`
- **Features**: Timestamps, stack traces, structured metadata

### 2. **Prometheus Metrics Service**
- **Location**: `src/common/metrics/metrics.service.ts`
- **Global**: Injected via `@Global()` decorator
- **Endpoint**: `GET /api/metrics` (Prometheus format)

### 3. **Auto-tracking Interceptor**
- **Location**: `src/common/interceptors/metrics.interceptor.ts`
- **Tracks**: All HTTP requests automatically
- **Logs**: Winston + Prometheus metrics

### 4. **Docker Compose**
- **Prometheus**: Port 9090, scrapes API every 10s
- **Grafana**: Port 3000, pre-configured datasource

---

## 📊 Metrics Tracked

| Metric | What | Example |
|--------|------|---------|
| `http_requests_total` | Total requests | `{method="POST", route="/api/chat/:id", status_code="200"} 1543` |
| `http_request_duration_seconds` | Response latency | Histogram with P50, P95, P99 |
| `ai_model_requests_total` | AI calls per model | `{model="gpt-4", provider="OpenAI", status="success"} 523` |
| `ai_model_request_duration_seconds` | AI response time | Average, P95, P99 |
| `cache_hits_total` | Cache hits | `{cache_type="chat"} 8234` |
| `cache_misses_total` | Cache misses | `{cache_type="chat"} 1766` |
| `cache_hit_rate` | Hit rate (0-1) | `0.823` (82.3%) |
| `active_connections` | Open connections | `{type="websocket"} 42` |

**Plus**: CPU, memory, event loop lag (auto-collected)

---

## 🚀 Quick Start

### 1. Start Services
```bash
docker-compose up -d prometheus grafana
```

### 2. Access Dashboards
- **API Metrics**: http://localhost:3001/api/metrics
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin / your_password)

### 3. Example Queries (PromQL)

**Total requests per model**:
```promql
sum by (model) (ai_model_requests_total)
```

**Average AI response time**:
```promql
avg(rate(ai_model_request_duration_seconds_sum[5m]) / rate(ai_model_request_duration_seconds_count[5m]))
```

**Cache hit rate**:
```promql
cache_hit_rate{cache_type="chat"}
```

**P95 latency**:
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

---

## 💻 Usage in Code

### Track Custom Metrics
```typescript
import { MetricsService } from '../common/metrics/metrics.service';

@Injectable()
export class MyService {
  constructor(private metrics: MetricsService) {}

  async doSomething() {
    const start = Date.now();
    
    try {
      await someOperation();
      this.metrics.recordAiModelRequest('gpt-4', 'OpenAI', 'success', duration);
    } catch (error) {
      this.metrics.recordAiModelRequest('gpt-4', 'OpenAI', 'error', duration);
    }
  }
}
```

### Track Cache
```typescript
// Cache hit
this.metrics.recordCacheHit('chat');

// Cache miss
this.metrics.recordCacheMiss('chat');

// Rate calculated automatically
```

### Track Connections
```typescript
// Increment
this.metrics.incrementActiveConnections('websocket');

// Decrement
this.metrics.decrementActiveConnections('websocket');
```

---

## 📁 Files Modified/Created

### Created
- `src/common/logger/logger.config.ts` - Winston config
- `src/common/metrics/metrics.service.ts` - Prometheus service
- `src/common/metrics/metrics.controller.ts` - `/metrics` endpoint
- `src/common/metrics/metrics.module.ts` - Global module
- `src/common/interceptors/metrics.interceptor.ts` - Auto-tracking
- `prometheus.yml` - Prometheus config
- `grafana/datasources.yml` - Grafana datasource
- `grafana/dashboards.yml` - Dashboard provisioning

### Modified
- `src/main.ts` - Integrated Winston logger
- `src/app.module.ts` - Added WinstonModule, MetricsModule, MetricsInterceptor
- `src/chat/chat.service.ts` - Added AI metrics tracking
- `docker-compose.yml` - Added Prometheus + Grafana services
- `package.json` - Added dependencies

### Dependencies Added
```json
{
  "winston": "3.18.3",
  "nest-winston": "1.10.2",
  "prom-client": "15.1.3",
  "@willsoto/nestjs-prometheus": "6.0.2",
  "@nestjs/terminus": "11.0.0"
}
```

---

## 🔧 Configuration

### Environment Variables (`.env`)
```env
# Prometheus (Basic Auth)
PROMETHEUS_AUTH=admin:$2y$05$...  # htpasswd -nb admin password

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your_secure_password
```

### Prometheus Scrape Config
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'whalli-api'
    static_configs:
      - targets: ['api:3001']
    metrics_path: '/api/metrics'
    scrape_interval: 10s
```

---

## 📈 Integration Points

### ChatService (AI Tracking)
```typescript
// Cache hit
this.metricsService.recordCacheHit('chat');

// Cache miss
this.metricsService.recordCacheMiss('chat');

// AI request
const aiRequestStartTime = Date.now();
try {
  // ... streaming response
  aiRequestSuccess = true;
} finally {
  const duration = (Date.now() - aiRequestStartTime) / 1000;
  this.metricsService.recordAiModelRequest(
    data.modelId,
    model.company.name,
    aiRequestSuccess ? 'success' : 'error',
    duration,
  );
}
```

### MetricsInterceptor (HTTP Tracking)
```typescript
// Automatic for all routes
@Injectable()
export class MetricsInterceptor {
  intercept(context, next) {
    const startTime = Date.now();
    return next.handle().pipe(
      tap(() => {
        const duration = (Date.now() - startTime) / 1000;
        this.metricsService.recordHttpRequest(method, route, statusCode, duration);
      })
    );
  }
}
```

---

## ✅ Validation

### Check Metrics Endpoint
```bash
curl http://localhost:3001/api/metrics
```

**Expected Output**:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/health",status_code="200"} 15

# HELP ai_model_requests_total Total number of requests per AI model
# TYPE ai_model_requests_total counter
ai_model_requests_total{model="gpt-4",provider="OpenAI",status="success"} 42
...
```

### Check Prometheus Targets
```bash
curl http://localhost:9090/api/v1/targets | jq
```

**Expected**: `whalli-api` target with state `"up"`

### Check Grafana
```bash
curl http://localhost:3000/api/health
```

**Expected**: `{"commit":"...","database":"ok","version":"..."}`

---

## 🎯 Key Features

✅ **Zero-config Tracking**: HTTP requests tracked automatically  
✅ **AI Model Metrics**: Per-model request count, latency, success rate  
✅ **Cache Analytics**: Hit/miss rates, automatic calculation  
✅ **Structured Logging**: JSON logs with timestamps, context, errors  
✅ **Prometheus Compatible**: Standard metrics format  
✅ **Grafana Ready**: Pre-configured datasource  
✅ **Production Ready**: Docker Compose, health checks, volume persistence

---

## 📚 See Also

- **Full Documentation**: `MONITORING_OBSERVABILITY.md` (4000+ lines)
- **Prometheus Docs**: https://prometheus.io/docs/
- **Grafana Docs**: https://grafana.com/docs/
- **Winston Docs**: https://github.com/winstonjs/winston

---

**Summary**: Complete observability stack with Winston JSON logging, Prometheus metrics (HTTP, AI models, cache), auto-tracking interceptor, and Grafana dashboards. Ready for production deployment via Docker Compose. 🎉
