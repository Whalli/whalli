# Monitoring & Observability System

**Date**: 2025-10-04  
**Components**: Winston Logger, Prometheus Metrics, Grafana Dashboard  
**Status**: ✅ Fully Integrated

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Winston Logger](#winston-logger)
3. [Prometheus Metrics](#prometheus-metrics)
4. [Grafana Dashboard](#grafana-dashboard)
5. [Docker Compose Setup](#docker-compose-setup)
6. [Metrics Tracked](#metrics-tracked)
7. [Usage Examples](#usage-examples)
8. [API Endpoints](#api-endpoints)

---

## 🎯 Overview

Complete monitoring and observability stack integrated into the Whalli API:

- **Winston Logger**: Structured JSON logging with file rotation
- **Prometheus Metrics**: Time-series metrics collection
- **Grafana**: Visual dashboards for monitoring
- **Automated Tracking**: HTTP requests, AI models, cache performance

**Architecture**:
```
┌─────────────┐
│   NestJS    │
│     API     │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       v              v
┌─────────────┐  ┌──────────────┐
│   Winston   │  │  Prometheus  │
│   Logger    │  │   Metrics    │
│  (JSON logs)│  │   Exporter   │
└─────────────┘  └──────┬───────┘
                        │
                        v
                 ┌──────────────┐
                 │  Prometheus  │
                 │   Server     │
                 └──────┬───────┘
                        │
                        v
                 ┌──────────────┐
                 │   Grafana    │
                 │  Dashboard   │
                 └──────────────┘
```

---

## 📝 Winston Logger

### Configuration

**File**: `src/common/logger/logger.config.ts`

```typescript
export const winstonConfig: WinstonModuleOptions = {
  transports: [
    // Console (JSON format)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    }),
    // Error logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    // Combined logs
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
  defaultMeta: {
    service: 'whalli-api',
  },
};
```

### Log Formats

**Console Output** (JSON):
```json
{
  "message": "Incoming request",
  "level": "info",
  "timestamp": "2025-10-04T12:00:00.000Z",
  "ms": "+0ms",
  "service": "whalli-api",
  "method": "POST",
  "url": "/api/chat/send",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Error Output**:
```json
{
  "message": "Request failed",
  "level": "error",
  "timestamp": "2025-10-04T12:00:01.500Z",
  "service": "whalli-api",
  "error": "Model not found",
  "stack": "Error: Model not found\n    at ChatService..."
}
```

### File Locations

- `logs/combined.log` - All logs (info, warn, error)
- `logs/error.log` - Error logs only

**Note**: `logs/` directory is gitignored

---

## 📊 Prometheus Metrics

### MetricsService

**File**: `src/common/metrics/metrics.service.ts`

Global service (injectable anywhere) exposing metrics tracking methods.

### Metrics Tracked

#### 1. **HTTP Requests**

```typescript
// Counter
http_requests_total{method, route, status_code}

// Histogram
http_request_duration_seconds{method, route, status_code}
```

**Labels**:
- `method`: GET, POST, PUT, DELETE, etc.
- `route`: `/api/chat/:id` (IDs normalized)
- `status_code`: 200, 400, 500, etc.

**Example**:
```
http_requests_total{method="POST",route="/api/chat/send",status_code="200"} 1543
http_request_duration_seconds_bucket{method="POST",route="/api/chat/send",status_code="200",le="0.1"} 1200
```

---

#### 2. **AI Model Requests**

```typescript
// Counter
ai_model_requests_total{model, provider, status}

// Histogram
ai_model_request_duration_seconds{model, provider}
```

**Labels**:
- `model`: gpt-4, claude-3-opus, grok-beta
- `provider`: OpenAI, Anthropic, xAI
- `status`: success, error

**Example**:
```
ai_model_requests_total{model="gpt-4",provider="OpenAI",status="success"} 523
ai_model_request_duration_seconds_sum{model="gpt-4",provider="OpenAI"} 1250.5
ai_model_request_duration_seconds_count{model="gpt-4",provider="OpenAI"} 523
```

**Average Latency Calculation**:
```promql
ai_model_request_duration_seconds_sum / ai_model_request_duration_seconds_count
```

---

#### 3. **Cache Performance**

```typescript
// Counters
cache_hits_total{cache_type}
cache_misses_total{cache_type}

// Gauge
cache_hit_rate{cache_type}
```

**Labels**:
- `cache_type`: chat (default)

**Example**:
```
cache_hits_total{cache_type="chat"} 8234
cache_misses_total{cache_type="chat"} 1766
cache_hit_rate{cache_type="chat"} 0.823
```

**Hit Rate**: 82.3% (calculated automatically)

---

#### 4. **Active Connections**

```typescript
// Gauge
active_connections{type}
```

**Labels**:
- `type`: websocket, http

**Example**:
```
active_connections{type="websocket"} 42
active_connections{type="http"} 15
```

---

#### 5. **System Metrics** (Default)

Collected automatically by `prom-client`:

- `process_cpu_user_seconds_total` - CPU usage
- `process_resident_memory_bytes` - Memory usage
- `nodejs_heap_size_used_bytes` - Node.js heap
- `nodejs_eventloop_lag_seconds` - Event loop lag

---

### MetricsInterceptor

**File**: `src/common/interceptors/metrics.interceptor.ts`

Global interceptor automatically tracking all HTTP requests.

**Features**:
- Records request start time
- Captures response status code
- Calculates duration
- Normalizes routes (replaces IDs with `:id`)
- Logs requests with Winston
- Records metrics with MetricsService

**Example**:
```
POST /api/chat/abc-123-def → /api/chat/:id
GET /api/tasks/456 → /api/tasks/:id
```

---

## 📈 Grafana Dashboard

### Access

- **URL**: `http://localhost:3000` (dev) or `https://grafana.${DOMAIN}` (production)
- **Default Credentials**:
  - Username: `admin`
  - Password: `${GRAFANA_ADMIN_PASSWORD}` (from .env)

### Pre-configured

- **Datasource**: Prometheus (auto-provisioned)
- **Refresh**: 10s interval
- **Retention**: Persistent storage in Docker volume

### Recommended Dashboard Panels

#### 1. **Request Rate**
```promql
rate(http_requests_total[5m])
```

#### 2. **Average Response Time**
```promql
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

#### 3. **AI Model Usage**
```promql
sum by (model) (ai_model_requests_total)
```

#### 4. **Cache Hit Rate**
```promql
cache_hit_rate{cache_type="chat"}
```

#### 5. **Error Rate**
```promql
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

---

## 🐳 Docker Compose Setup

### Services Added

#### **Prometheus**

```yaml
prometheus:
  image: prom/prometheus:latest
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
    - prometheus-data:/prometheus
  networks:
    - whalli-network
  labels:
    - traefik.enable=true
    - traefik.http.routers.prometheus.rule=Host(`prometheus.${DOMAIN}`)
```

**Config** (`prometheus.yml`):
```yaml
scrape_configs:
  - job_name: 'whalli-api'
    static_configs:
      - targets: ['api:3001']
    metrics_path: '/api/metrics'
    scrape_interval: 10s
```

**Access**: `https://prometheus.${DOMAIN}` (requires basic auth)

---

#### **Grafana**

```yaml
grafana:
  image: grafana/grafana:latest
  environment:
    GF_SECURITY_ADMIN_USER: ${GRAFANA_ADMIN_USER}
    GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
  volumes:
    - grafana-data:/var/lib/grafana
    - ./grafana/datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml:ro
  depends_on:
    - prometheus
```

**Datasource** (`grafana/datasources.yml`):
```yaml
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true
```

**Access**: `https://grafana.${DOMAIN}`

---

### Environment Variables

Add to `.env`:

```env
# Prometheus
PROMETHEUS_AUTH=admin:$2y$05$... # htpasswd hash

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your_secure_password
```

**Generate htpasswd**:
```bash
htpasswd -nb admin your_password
```

---

## 🔧 Usage Examples

### 1. **Inject MetricsService**

```typescript
import { MetricsService } from '../common/metrics/metrics.service';

@Injectable()
export class MyService {
  constructor(private metricsService: MetricsService) {}

  async doSomething() {
    const startTime = Date.now();
    
    try {
      // Your logic
      const result = await someOperation();
      
      // Record success
      this.metricsService.recordAiModelRequest(
        'gpt-4',
        'OpenAI',
        'success',
        (Date.now() - startTime) / 1000,
      );
      
      return result;
    } catch (error) {
      // Record error
      this.metricsService.recordAiModelRequest(
        'gpt-4',
        'OpenAI',
        'error',
        (Date.now() - startTime) / 1000,
      );
      
      throw error;
    }
  }
}
```

---

### 2. **Track Cache Operations**

```typescript
// Cache hit
this.metricsService.recordCacheHit('chat');

// Cache miss
this.metricsService.recordCacheMiss('chat');

// Hit rate is calculated automatically
```

---

### 3. **Track WebSocket Connections**

```typescript
@WebSocketGateway()
export class MyGateway {
  constructor(private metricsService: MetricsService) {}

  handleConnection(client: Socket) {
    this.metricsService.incrementActiveConnections('websocket');
  }

  handleDisconnect(client: Socket) {
    this.metricsService.decrementActiveConnections('websocket');
  }
}
```

---

### 4. **Custom Metrics**

```typescript
// Direct access to registry
const counter = new Counter({
  name: 'my_custom_metric',
  help: 'My custom metric description',
  registers: [this.metricsService.registry],
});

counter.inc();
```

---

## 🔌 API Endpoints

### GET `/api/metrics`

Returns metrics in Prometheus format.

**Response**:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="POST",route="/api/chat/send",status_code="200"} 1543

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="POST",route="/api/chat/send",status_code="200",le="0.005"} 0
http_request_duration_seconds_bucket{method="POST",route="/api/chat/send",status_code="200",le="0.01"} 45
...
```

**Content-Type**: `text/plain; version=0.0.4`

---

### GET `/api/metrics/json`

Returns metrics in JSON format (for debugging).

**Response**:
```json
[
  {
    "name": "http_requests_total",
    "help": "Total number of HTTP requests",
    "type": "counter",
    "values": [
      {
        "labels": {
          "method": "POST",
          "route": "/api/chat/send",
          "status_code": "200"
        },
        "value": 1543
      }
    ]
  }
]
```

---

## 📊 Metrics Summary

### Tracked Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | method, route, status_code | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | method, route, status_code | HTTP request latency |
| `ai_model_requests_total` | Counter | model, provider, status | AI model requests |
| `ai_model_request_duration_seconds` | Histogram | model, provider | AI request latency |
| `cache_hits_total` | Counter | cache_type | Cache hits |
| `cache_misses_total` | Counter | cache_type | Cache misses |
| `cache_hit_rate` | Gauge | cache_type | Cache hit rate (0-1) |
| `active_connections` | Gauge | type | Active connections |

### System Metrics (Auto-collected)

- CPU usage
- Memory usage
- Event loop lag
- GC statistics

---

## 🚀 Deployment

### Start Monitoring Stack

```bash
# Development (local)
docker-compose up prometheus grafana

# Production (full stack)
docker-compose up -d
```

### Verify Services

```bash
# Prometheus
curl http://localhost:9090/-/healthy

# Grafana
curl http://localhost:3000/api/health

# API Metrics
curl http://localhost:3001/api/metrics
```

### Prometheus Targets

Check targets health:
- **URL**: `http://localhost:9090/targets`
- **Expected**: `whalli-api` target UP

---

## 📈 Example Queries

### PromQL Queries

#### **Total Requests per Model**
```promql
sum by (model) (ai_model_requests_total)
```

#### **Average AI Response Time**
```promql
avg(rate(ai_model_request_duration_seconds_sum[5m]) / rate(ai_model_request_duration_seconds_count[5m])) by (model)
```

#### **P95 Response Time**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

#### **Error Rate (Last 5min)**
```promql
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

#### **Cache Efficiency**
```promql
(cache_hits_total / (cache_hits_total + cache_misses_total)) * 100
```

---

## ✅ Implementation Checklist

- [x] Winston logger configured (JSON output)
- [x] MetricsService created
- [x] MetricsController for `/metrics` endpoint
- [x] MetricsInterceptor for automatic HTTP tracking
- [x] ChatService integration (AI model tracking)
- [x] Cache tracking (hits/misses/rate)
- [x] Prometheus configuration file
- [x] Grafana datasource configuration
- [x] Docker Compose updated
- [x] Environment variables documented
- [x] TypeScript compilation successful (0 errors)

---

## 🔒 Security

### Prometheus Access

Protected with HTTP Basic Auth (Traefik middleware):
```yaml
- traefik.http.middlewares.prometheus-auth.basicauth.users=${PROMETHEUS_AUTH}
```

### Grafana Access

Protected with username/password:
```env
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=your_secure_password
```

### Metrics Endpoint

Currently public at `/api/metrics`. Consider adding authentication:

```typescript
@Controller('metrics')
@UseGuards(JwtAuthGuard) // Add auth if needed
export class MetricsController {
  // ...
}
```

---

## 📚 Resources

- **Winston Docs**: https://github.com/winstonjs/winston
- **Prometheus Docs**: https://prometheus.io/docs/
- **Grafana Docs**: https://grafana.com/docs/
- **prom-client**: https://github.com/siimon/prom-client
- **nest-winston**: https://github.com/gremo/nest-winston

---

## 🎯 Next Steps

1. **Create Grafana Dashboards**:
   - Import pre-built dashboards
   - Create custom panels
   - Set up alerts

2. **Add Alerting Rules**:
   ```yaml
   # prometheus-alerts.yml
   groups:
     - name: api_alerts
       rules:
         - alert: HighErrorRate
           expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
           for: 5m
           annotations:
             summary: "High error rate detected"
   ```

3. **Log Aggregation**:
   - Add Loki for log aggregation
   - Connect Winston → Loki
   - Query logs in Grafana

4. **Distributed Tracing**:
   - Add Jaeger/Tempo
   - Instrument spans
   - Trace requests across services

---

**End of Documentation**
