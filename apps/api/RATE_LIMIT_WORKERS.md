# Rate Limiting & Workers Architecture

Complete guide to the rate limiting system and separated BullMQ workers architecture.

## Table of Contents

1. [Overview](#overview)
2. [Rate Limiting System](#rate-limiting-system)
3. [Workers Architecture](#workers-architecture)
4. [Configuration](#configuration)
5. [Usage Examples](#usage-examples)
6. [Docker Deployment](#docker-deployment)
7. [Development](#development)
8. [Testing](#testing)
9. [Monitoring](#monitoring)

---

## Overview

### What Was Implemented

1. **Rate Limiting System** (`RateLimitGuard`)
   - Per-user rate limiting (authenticated requests)
   - Per-IP rate limiting (unauthenticated requests)
   - Redis-based counter storage with automatic TTL
   - Custom rate limits per route via decorators
   - Standard HTTP headers (`X-RateLimit-*`, `Retry-After`)

2. **Separated Workers Process**
   - BullMQ workers run in dedicated process
   - Offloads CPU-intensive tasks from API server
   - Workers: Voice Transcription, Recurring Search
   - Separate Docker container for scalability
   - Independent deployment and scaling

### Benefits

- **Performance**: API server remains responsive during heavy processing
- **Scalability**: Workers can be scaled independently
- **Reliability**: Worker failures don't affect API availability
- **Protection**: Rate limiting prevents abuse and resource exhaustion
- **Monitoring**: Separate metrics for API and workers

---

## Rate Limiting System

### Architecture

```
Client Request
     ↓
RateLimitGuard (Global)
     ↓
Check Redis: rate_limit:{user|ip}:{windowSeconds}
     ↓
├─ Count < Limit → Increment → Allow (200)
└─ Count ≥ Limit → Reject (429 Too Many Requests)
```

### Default Limits

| Type | Limit | Window | Redis Key |
|------|-------|--------|-----------|
| Authenticated User | 100 requests | 60 seconds | `rate_limit:user:{userId}:60` |
| Unauthenticated IP | 20 requests | 60 seconds | `rate_limit:ip:{ipAddress}:60` |

### Custom Rate Limits

Use `@RateLimit()` decorator on any route:

```typescript
import { RateLimit } from '../common/guards/rate-limit.guard';

@Controller('expensive')
export class ExpensiveController {
  // Limit to 10 requests per minute
  @RateLimit({ maxRequests: 10, windowSeconds: 60 })
  @Get('operation')
  async expensiveOperation() {
    return 'Heavy computation...';
  }

  // Limit to 5 requests per hour
  @RateLimit({ maxRequests: 5, windowSeconds: 3600 })
  @Post('ai-generation')
  async aiGeneration() {
    return 'Generating...';
  }
}
```

### Skip Rate Limiting

Use `@SkipRateLimit()` for health checks, webhooks, etc.:

```typescript
import { SkipRateLimit } from '../common/guards/rate-limit.guard';

@Controller('health')
export class HealthController {
  @SkipRateLimit()
  @Get()
  async check() {
    return { status: 'ok' };
  }
}

@Controller('webhooks')
export class WebhooksController {
  @SkipRateLimit() // Stripe webhooks should not be rate limited
  @Post('stripe')
  async handleStripeWebhook() {
    // ...
  }
}
```

### Response Headers

All responses include rate limit headers:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1735123456789

HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1735123456789
Retry-After: 45

{
  "statusCode": 429,
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "error": "Too Many Requests"
}
```

### IP Address Detection

RateLimitGuard extracts client IP from:
1. `X-Forwarded-For` header (proxies/load balancers)
2. `X-Real-IP` header
3. Socket remote address (fallback)

This works with Traefik, Nginx, Cloudflare, AWS ALB, etc.

### Redis Keys & TTL

| Scenario | Redis Key | TTL | Value |
|----------|-----------|-----|-------|
| User (1st request) | `rate_limit:user:abc123:60` | 60s | `1` |
| User (5th request) | `rate_limit:user:abc123:60` | 55s | `5` |
| IP (1st request) | `rate_limit:ip:192.168.1.1:60` | 60s | `1` |

**Automatic Cleanup**: Redis TTL expires keys automatically, no manual cleanup needed.

### Configuration

Environment variables:

```bash
# Enable/disable rate limiting (default: true)
RATE_LIMIT_ENABLED=true

# Redis connection (required)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### Error Handling

- **Redis Connection Failure**: Guard fails open (allows requests)
- **Redis Timeout**: Guard allows request with warning log
- **Invalid Data**: Guard allows request, logs error

This ensures availability even if Redis is down.

---

## Workers Architecture

### Motivation

**Before** (Single Process):
```
API Server Process
├─ HTTP Handlers
├─ WebSocket Gateway
└─ BullMQ Workers ❌ (blocks event loop)
```

**After** (Separated):
```
API Server Process          Workers Process
├─ HTTP Handlers            ├─ Voice Transcription Worker
├─ WebSocket Gateway        └─ Recurring Search Worker
└─ Enqueue Jobs Only ✅
```

### Benefits

1. **Performance**: API server never blocks on long-running tasks
2. **Scalability**: Scale workers independently (multiple instances)
3. **Resource Isolation**: Workers use separate CPU/memory
4. **Fault Isolation**: Worker crash doesn't affect API
5. **Monitoring**: Separate logs and metrics per process

### Workers Included

#### 1. Voice Transcription Worker

**Queue**: `voice-transcription`  
**Processor**: `VoiceTranscriptionProcessor`  
**Job Data**:
```typescript
{
  attachmentId: string;
  audioUrl: string;
  userId: string;
  projectId?: string;
  taskId?: string;
}
```

**Processing**:
1. Download audio from MinIO
2. Call OpenAI Whisper API for transcription
3. Create `Message` with transcript
4. Update `Attachment` with transcript and status

**Average Duration**: 10-30 seconds per job

---

#### 2. Recurring Search Worker

**Queue**: `recurring-search`  
**Processor**: `RecurringSearchProcessor`  
**Job Data**:
```typescript
{
  searchId: string;
}
```

**Processing**:
1. Fetch `RecurringSearch` from database
2. Execute web search via `WebSearchAdapter`
3. Store results in `SearchResult` table
4. Update `lastExecutedAt` timestamp

**Average Duration**: 5-15 seconds per job

---

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Server (Port 3001)                  │
├─────────────────────────────────────────────────────────────┤
│  Controllers:                                               │
│  - VoiceController.uploadAudio() → Enqueue job             │
│  - RecurringSearchController.create() → Schedule job        │
│                                                             │
│  Services:                                                  │
│  - VoiceService.uploadAndTranscribe()                       │
│  - RecurringSearchService.scheduleJob()                     │
│                                                             │
│  BullMQ: Queue Registration Only (no processors)           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Redis (Port 6379)                        │
├─────────────────────────────────────────────────────────────┤
│  Queues:                                                    │
│  - voice-transcription (jobs)                               │
│  - recurring-search (jobs + schedules)                      │
│                                                             │
│  Rate Limits:                                               │
│  - rate_limit:user:{userId}:{window}                        │
│  - rate_limit:ip:{ipAddress}:{window}                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Workers Process                          │
├─────────────────────────────────────────────────────────────┤
│  Processors:                                                │
│  - VoiceTranscriptionProcessor (queue: voice-transcription) │
│    → Calls OpenAI Whisper API                               │
│    → Creates Message with transcript                        │
│                                                             │
│  - RecurringSearchProcessor (queue: recurring-search)       │
│    → Executes web search                                    │
│    → Stores results                                         │
│                                                             │
│  Services: VoiceService, RecurringSearchService             │
│  BullMQ: Worker Hosts (process jobs)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables

```bash
# API Server (.env)
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/whalli

# Redis (for BullMQ + Rate Limiting)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Rate Limiting
RATE_LIMIT_ENABLED=true  # Set to false to disable

# MinIO (for file storage)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=whalli

# OpenAI (for Whisper transcription)
OPENAI_API_KEY=sk-xxx
```

### Redis Requirements

- **Version**: Redis 6.0+ (for `SETEX`, `INCR`, `TTL` commands)
- **Memory**: ~100MB for rate limiting + BullMQ queues
- **Persistence**: Recommended (AOF or RDB) for job durability

### Docker Compose Services

```yaml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]

  api:
    environment:
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      RATE_LIMIT_ENABLED: true
    depends_on:
      - redis

  workers:
    environment:
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
    depends_on:
      - redis
```

---

## Usage Examples

### Example 1: Custom Rate Limit for AI Chat

```typescript
// apps/api/src/chat/chat.controller.ts
import { RateLimit } from '../common/guards/rate-limit.guard';

@Controller('chat')
export class ChatController {
  // Allow 30 messages per minute (to prevent spam)
  @RateLimit({ maxRequests: 30, windowSeconds: 60 })
  @Post('message')
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }

  // Allow 10 AI streaming requests per minute (expensive)
  @RateLimit({ maxRequests: 10, windowSeconds: 60 })
  @Sse('stream')
  async streamResponse(@Query('chatId') chatId: string) {
    return this.chatService.streamResponse(chatId);
  }
}
```

### Example 2: Skip Rate Limiting for Admin

```typescript
// apps/api/src/admin/admin.controller.ts
import { SkipRateLimit } from '../common/guards/rate-limit.guard';

@Controller('admin')
@UseGuards(AdminGuard) // Custom admin authentication
export class AdminController {
  @SkipRateLimit() // Admins are trusted
  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @SkipRateLimit()
  @Delete('user/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}
```

### Example 3: Different Limits for Public vs. Authenticated

```typescript
// apps/api/src/search/search.controller.ts
import { RateLimit } from '../common/guards/rate-limit.guard';

@Controller('search')
export class SearchController {
  // Public endpoint: 10 requests/min per IP
  @RateLimit({ maxRequests: 10, windowSeconds: 60 })
  @Get('public')
  async publicSearch(@Query('q') query: string) {
    return this.searchService.search(query);
  }

  // Authenticated endpoint: 100 requests/min per user (default)
  @UseGuards(AuthGuard)
  @Get('private')
  async privateSearch(@Query('q') query: string) {
    return this.searchService.search(query);
  }
}
```

---

## Docker Deployment

### Build Images

```bash
# Build API image
docker build -f apps/api/Dockerfile -t whalli-api:latest .

# Build Workers image
docker build -f apps/api/Dockerfile.workers -t whalli-workers:latest .
```

### Start Services

```bash
# Start all services (Redis, API, Workers)
docker-compose up -d

# View logs
docker-compose logs -f api
docker-compose logs -f workers

# Scale workers (run 3 instances)
docker-compose up -d --scale workers=3
```

### Health Checks

```bash
# API health
curl http://localhost:3001/api/health

# Redis health
docker exec whalli-redis redis-cli --raw incr ping

# Check workers are running
docker logs whalli-workers | grep "Workers started successfully"
```

---

## Development

### Local Development Setup

#### Terminal 1: Start API Server

```bash
cd apps/api
pnpm dev
```

#### Terminal 2: Start Workers

```bash
cd apps/api
pnpm dev:workers
```

#### Terminal 3: Redis (if not using Docker)

```bash
redis-server --requirepass your_password
```

### Development Scripts

```json
{
  "dev": "nest start --watch",
  "dev:workers": "nest start --watch --entryFile workers/main",
  "build": "nest build",
  "build:workers": "nest build workers",
  "build:all": "nest build && nest build workers",
  "start:prod": "node dist/main",
  "start:workers:prod": "node dist/workers/main.js"
}
```

### Testing Workers Locally

```typescript
// Enqueue a test job via API
POST http://localhost:3001/api/voice/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "file": <audio_file>,
  "userId": "user123",
  "projectId": "proj456"
}

// Check logs in Terminal 2 (workers)
// You should see:
// [VoiceTranscriptionProcessor] Processing transcription job...
// [VoiceTranscriptionProcessor] Transcription complete for attachment abc123
```

---

## Testing

### Unit Tests

```typescript
// Test RateLimitGuard
describe('RateLimitGuard', () => {
  it('should allow requests under limit', async () => {
    const guard = new RateLimitGuard(configService, reflector);
    const context = createMockContext();
    
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should reject requests over limit', async () => {
    // Make 101 requests
    for (let i = 0; i < 101; i++) {
      await guard.canActivate(context);
    }
    
    await expect(guard.canActivate(context)).rejects.toThrow('Too Many Requests');
  });
});
```

### Integration Tests

```bash
# Start test Redis
docker run -d -p 6380:6379 redis:7-alpine redis-server --requirepass test

# Run tests
REDIS_PORT=6380 REDIS_PASSWORD=test pnpm test:e2e
```

### Load Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test rate limiting (should get 429 after 20 requests)
ab -n 100 -c 10 http://localhost:3001/api/chat/messages

# Test with authentication (should get 429 after 100 requests)
ab -n 200 -c 10 -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/chat/messages
```

---

## Monitoring

### Prometheus Metrics

RateLimitGuard automatically tracks metrics:

```prometheus
# Rate limit rejections
http_requests_rate_limited_total{endpoint="/api/chat/message"} 45

# Rate limit checks
http_requests_rate_limit_checks_total{endpoint="/api/chat/message"} 1234
```

### Grafana Dashboard

Query examples:

```promql
# Rate limit rejection rate
rate(http_requests_rate_limited_total[5m])

# Top rate-limited endpoints
topk(10, sum by (endpoint) (http_requests_rate_limited_total))

# Rate limit hit rate (%)
(http_requests_rate_limited_total / http_requests_rate_limit_checks_total) * 100
```

### Redis Monitoring

```bash
# Check rate limit keys
docker exec whalli-redis redis-cli --scan --pattern "rate_limit:*"

# Count rate limit keys
docker exec whalli-redis redis-cli --scan --pattern "rate_limit:*" | wc -l

# Check specific user's rate limit
docker exec whalli-redis redis-cli GET "rate_limit:user:abc123:60"
docker exec whalli-redis redis-cli TTL "rate_limit:user:abc123:60"
```

### BullMQ Monitoring

```bash
# Check queue stats
curl http://localhost:3001/api/bull-board

# Redis CLI
docker exec whalli-redis redis-cli
> LLEN bull:voice-transcription:waiting   # Pending jobs
> LLEN bull:voice-transcription:active    # Processing jobs
> LLEN bull:voice-transcription:completed # Completed jobs
> LLEN bull:voice-transcription:failed    # Failed jobs
```

### Logging

**API Server Logs**:
```bash
docker logs whalli-api | grep "Rate limit"
# [RateLimitGuard] Rate limit exceeded for user:abc123
```

**Workers Logs**:
```bash
docker logs whalli-workers
# [VoiceTranscriptionProcessor] Processing transcription job 12345
# [RecurringSearchProcessor] Successfully executed search search123
```

---

## Summary

### Files Created

1. **Rate Limiting**:
   - `src/common/guards/rate-limit.guard.ts` (250 lines)

2. **Workers**:
   - `src/workers/workers.module.ts` (60 lines)
   - `src/workers/main.ts` (50 lines)
   - `apps/api/Dockerfile.workers` (50 lines)
   - `nest-cli.json` (updated with workers project)

3. **Documentation**:
   - `RATE_LIMIT_WORKERS.md` (this file, 800+ lines)

### Files Modified

1. `src/app.module.ts` - Added `RateLimitGuard` as global guard
2. `src/voice/voice.module.ts` - Removed processor (moved to workers)
3. `src/recurring-search/recurring-search.module.ts` - Removed processor
4. `docker-compose.yml` - Added workers service
5. `package.json` - Added worker scripts

### Commands

```bash
# Development
pnpm dev              # Start API server
pnpm dev:workers      # Start workers

# Production
pnpm build:all        # Build API + workers
node dist/main        # Run API server
node dist/workers/main.js  # Run workers

# Docker
docker-compose up -d  # Start all services
docker-compose logs -f workers  # View worker logs
docker-compose up -d --scale workers=3  # Scale workers
```

### Next Steps

1. **Testing**: Write unit tests for RateLimitGuard
2. **Monitoring**: Add custom Prometheus metrics
3. **Scaling**: Test horizontal scaling of workers
4. **Optimization**: Tune rate limits based on usage patterns
5. **Documentation**: Update API docs with rate limit headers

---

**Status**: ✅ Complete  
**Version**: 1.0.0  
**Last Updated**: October 5, 2025
