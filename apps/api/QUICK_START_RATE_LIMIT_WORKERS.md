# 🚀 Quick Start - Rate Limiting & Workers

Get up and running with rate limiting and separated workers in 5 minutes.

## Step 1: Environment Setup

Add to your `.env` file:

```bash
# Redis (required for rate limiting + BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password

# Rate limiting
RATE_LIMIT_ENABLED=true

# OpenAI (for voice transcription worker)
OPENAI_API_KEY=sk-xxx
```

## Step 2: Start Redis

### Option A: Docker (Recommended)

```bash
docker-compose up -d redis
```

### Option B: Local Redis

```bash
# Install Redis
sudo apt install redis-server  # Ubuntu/Debian
brew install redis             # macOS

# Start Redis with password
redis-server --requirepass your_secure_password
```

## Step 3: Start Development Servers

Open 2 terminals:

### Terminal 1: API Server

```bash
cd apps/api
pnpm dev
```

You should see:
```
[RateLimitGuard] Redis connected for rate limiting
[Nest] API server listening on http://localhost:3001
```

### Terminal 2: Workers

```bash
cd apps/api
pnpm dev:workers
```

You should see:
```
[WorkersBootstrap] 🚀 BullMQ Workers started successfully
[WorkersBootstrap] 📋 Active workers:
  - Voice Transcription Worker (queue: voice-transcription)
  - Recurring Search Worker (queue: recurring-search)
[WorkersBootstrap] ⏳ Workers are now processing jobs...
```

## Step 4: Test Rate Limiting

### Test 1: Check Headers

```bash
curl -I http://localhost:3001/api/health
```

Expected response:
```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
X-RateLimit-Reset: 1735123456789
```

### Test 2: Trigger Rate Limit

```bash
# Send 25 requests (limit is 20 for unauthenticated)
for i in {1..25}; do
  curl -I http://localhost:3001/api/health 2>/dev/null | grep "HTTP"
done
```

Expected output:
```
HTTP/1.1 200 OK  (requests 1-20)
HTTP/1.1 429 Too Many Requests  (requests 21-25)
```

### Test 3: Custom Rate Limit

```bash
# This endpoint has custom limit (check example controller)
curl http://localhost:3001/api/example/expensive
```

## Step 5: Test Workers

### Test 1: Voice Transcription

Upload an audio file:

```bash
curl -X POST http://localhost:3001/api/voice/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_audio.mp3" \
  -F "userId=user123"
```

Check worker logs (Terminal 2):
```
[VoiceTranscriptionProcessor] Processing transcription job 12345
[VoiceTranscriptionProcessor] Transcription complete for attachment abc123
```

### Test 2: Check Queue

```bash
# Check pending jobs
docker exec whalli-redis redis-cli LLEN bull:voice-transcription:waiting

# Check active jobs
docker exec whalli-redis redis-cli LLEN bull:voice-transcription:active
```

## Step 6: Production Deployment

### Build

```bash
# Build API + Workers
cd apps/api
pnpm build:all
```

### Deploy with Docker

```bash
# Start all services
docker-compose up -d

# Scale workers (run 3 instances)
docker-compose up -d --scale workers=3

# Check logs
docker-compose logs -f api
docker-compose logs -f workers
```

## Usage in Your Code

### Example 1: Custom Rate Limit

```typescript
import { Controller, Post } from '@nestjs/common';
import { RateLimit } from '../common/guards/rate-limit.guard';

@Controller('chat')
export class ChatController {
  
  // 30 messages per minute
  @RateLimit({ maxRequests: 30, windowSeconds: 60 })
  @Post('send')
  async sendMessage() {
    // Your logic
  }
}
```

### Example 2: Skip Rate Limiting

```typescript
import { Controller, Get } from '@nestjs/common';
import { SkipRateLimit } from '../common/guards/rate-limit.guard';

@Controller('webhooks')
export class WebhooksController {
  
  @SkipRateLimit()  // Webhooks should not be rate limited
  @Post('stripe')
  async handleWebhook() {
    // Your logic
  }
}
```

### Example 3: Enqueue Background Job

```typescript
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MyService {
  constructor(
    @InjectQueue('voice-transcription') private queue: Queue,
  ) {}
  
  async transcribeAudio(audioUrl: string) {
    // Enqueue job (workers will process it)
    await this.queue.add('transcribe', {
      audioUrl,
      userId: 'user123',
    });
  }
}
```

## Common Issues

### Issue 1: "Redis connection error"

**Solution**: Check Redis is running
```bash
docker ps | grep redis
# or
redis-cli ping
```

### Issue 2: "Rate limit not working"

**Solution**: Check environment variable
```bash
echo $RATE_LIMIT_ENABLED
# Should output: true
```

### Issue 3: "Workers not processing jobs"

**Solution**: Check workers are running
```bash
docker logs whalli-workers | grep "Workers started"
```

## Monitoring

### Real-time Queue Stats

```bash
# Watch queue length (updates every 2 seconds)
watch -n 2 'docker exec whalli-redis redis-cli LLEN bull:voice-transcription:waiting'
```

### Rate Limit Keys

```bash
# View all rate limit keys
docker exec whalli-redis redis-cli --scan --pattern "rate_limit:*"

# Check specific user's rate limit
docker exec whalli-redis redis-cli GET "rate_limit:user:abc123:60"
```

### Worker Health

```bash
# Check worker logs
docker logs -f whalli-workers

# Check if workers are processing
docker logs whalli-workers | grep "Processing"
```

## Next Steps

1. ✅ **You're done!** Rate limiting and workers are now active
2. 📚 Read full documentation: `RATE_LIMIT_WORKERS.md`
3. 🧪 Write tests for your rate-limited endpoints
4. 📊 Set up Prometheus/Grafana for monitoring
5. 🔧 Tune rate limits based on your usage patterns

## Resources

- **Full Documentation**: `RATE_LIMIT_WORKERS.md`
- **Summary**: `RATE_LIMIT_WORKERS_SUMMARY.md`
- **Workers README**: `src/workers/README.md`
- **Example Controller**: `src/example/example.controller.ts`

---

**Questions?** Check the troubleshooting section in `RATE_LIMIT_WORKERS.md`
