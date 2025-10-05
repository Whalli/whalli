# Chat Response Caching System

Complete guide to the Redis-based caching layer for AI chat responses in the Whalli API.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [How It Works](#how-it-works)
4. [Configuration](#configuration)
5. [Cache Key Generation](#cache-key-generation)
6. [Performance Benefits](#performance-benefits)
7. [API Integration](#api-integration)
8. [Cache Management](#cache-management)
9. [Testing](#testing)
10. [Monitoring](#monitoring)

---

## Overview

The chat caching system stores AI model responses in Redis to avoid redundant API calls for identical requests. When a user sends the same prompt to the same model, the cached response is streamed instead of calling the AI provider again.

### Key Features

- ✅ **Automatic Caching**: All successful AI responses are cached
- ✅ **Cache Hit Detection**: Identical model + prompt combinations are detected
- ✅ **Streaming Preserved**: Cached responses are streamed character-by-character
- ✅ **TTL Management**: 1-hour expiration for all cached entries
- ✅ **SHA-256 Hashing**: Collision-resistant cache keys
- ✅ **Graceful Degradation**: Cache failures don't block requests

### Benefits

- **Cost Reduction**: Avoid duplicate API calls to expensive AI providers
- **Faster Response Times**: Cached responses return instantly
- **Rate Limit Protection**: Reduces load on AI provider APIs
- **Better User Experience**: Instant responses for repeat questions

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Chat Request Flow                      │
└─────────────────────────────────────────────────────────────┘

1. User Request → ChatController.streamChat()
                         ↓
2. ChatService.streamChatResponse()
                         ↓
3. ChatCacheService.getCachedResponse(modelId, prompt)
                         ↓
        ┌───────────────┴───────────────┐
        │                               │
   [CACHE HIT]                    [CACHE MISS]
        │                               │
        ↓                               ↓
4. Stream cached response        Call AI Provider API
   character-by-character              ↓
        │                         5. Stream real response
        │                               ↓
        │                         6. ChatCacheService.setCachedResponse()
        │                               │
        └───────────────┬───────────────┘
                        ↓
7. Save message to database (Prisma)
                        ↓
8. Yield 'complete' event with metadata
```

### Components

1. **ChatCacheService** (`src/chat/chat-cache.service.ts`)
   - Redis client management
   - Cache key generation (SHA-256)
   - Get/Set/Invalidate operations
   - TTL management (1 hour)

2. **ChatService** (`src/chat/chat.service.ts`)
   - Integrates cache checks into streaming flow
   - Handles cache hits with simulated streaming
   - Stores responses after AI model calls

3. **Redis Server**
   - Runs on `localhost:6379` (default)
   - Shared with BullMQ queues (Voice, Recurring Search)
   - No persistence required (cache-only)

---

## How It Works

### 1. Cache Key Generation

Each request generates a unique cache key:

```typescript
// Input
modelId: "gpt-4-turbo"
prompt: "What is the capital of France?"

// Process
const combined = "gpt-4-turbo:What is the capital of France?"
const hash = sha256(combined) // "a3f5b2c1d4e5f6a7b8c9d0e1f2a3b4c5..."
const cacheKey = "chat:cache:a3f5b2c1d4e5f6a7b8c9d0e1f2a3b4c5..."
```

### 2. Cache Lookup (Before AI Call)

```typescript
async *streamChatResponse(data) {
  // 1. Check cache first
  const cachedResponse = await this.chatCache.getCachedResponse(
    data.modelId,
    data.prompt
  );

  if (cachedResponse) {
    // CACHE HIT - Stream cached response
    yield { type: 'cache_hit', data: { cached: true } };
    
    for (let i = 0; i < cachedResponse.length; i++) {
      yield { type: 'chunk', data: { content: cachedResponse[i] } };
      await sleep(10); // Simulate natural streaming
    }
    
    yield { 
      type: 'complete', 
      data: { fullResponse: cachedResponse, fromCache: true } 
    };
    return;
  }

  // CACHE MISS - Proceed with AI call...
}
```

### 3. Caching Response (After AI Call)

```typescript
// After streaming all chunks from AI provider
let fullResponse = '';

for await (const chunk of adapter.streamChatCompletion(modelId, prompt)) {
  fullResponse += chunk;
  yield { type: 'chunk', data: { content: chunk } };
}

// Store complete response in cache
await this.chatCache.setCachedResponse(modelId, prompt, fullResponse);
```

### 4. TTL and Expiration

```typescript
// Redis SET with expiration
await redisClient.setEx(cacheKey, 3600, response); // 1 hour = 3600 seconds
```

After 1 hour, the key automatically expires and the next request will be a cache miss.

---

## Configuration

### Environment Variables

Add to `apps/api/.env`:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=           # Optional, leave empty for local dev
```

### Cache Settings

Modify in `ChatCacheService`:

```typescript
private readonly CACHE_TTL = 3600; // 1 hour (adjust as needed)
private readonly CACHE_PREFIX = 'chat:cache:'; // Key namespace
```

**Recommended TTL Values**:
- **Development**: 1 hour (3600s) - good for testing
- **Production**: 4 hours (14400s) - balance between freshness and savings
- **High-Traffic**: 24 hours (86400s) - maximum cost savings

### Streaming Delay

Adjust character-by-character delay for cached responses:

```typescript
// In ChatService.streamChatResponse()
await new Promise((resolve) => setTimeout(resolve, 10)); // 10ms per character
```

**Delay Options**:
- `5ms`: Very fast (200 chars/second)
- `10ms`: Balanced (100 chars/second) - **Default**
- `20ms`: Slower, more natural (50 chars/second)

---

## Cache Key Generation

### Algorithm

```typescript
generateCacheKey(modelId: string, prompt: string): string {
  const combined = `${modelId}:${prompt}`;
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  return `chat:cache:${hash}`;
}
```

### Example

```typescript
// Input
modelId: "claude-3-opus"
prompt: "Explain quantum computing in simple terms"

// Output
cacheKey: "chat:cache:7f3e9b5c2a1d4f6e8b9a0c3d5e7f1a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6"
```

### Collision Resistance

- **SHA-256**: 256-bit hash space (2^256 possibilities)
- **Collision Probability**: Negligible (< 1 in 10^77)
- **Key Length**: 64 hex characters + prefix

---

## Performance Benefits

### Cost Savings

**Scenario**: 1000 users ask "What is AI?" to GPT-4

| Metric | Without Cache | With Cache | Savings |
|--------|---------------|------------|---------|
| API Calls | 1000 | 1 | **99.9%** |
| Cost (GPT-4) | $30.00 | $0.03 | **$29.97** |
| Response Time | 2-5s each | <100ms | **95%+ faster** |

### Response Time Comparison

```
First Request (Cache Miss):
User → Check Cache (5ms) → AI Model (2500ms) → Stream (200ms) → Total: ~2.7s

Subsequent Requests (Cache Hit):
User → Check Cache (5ms) → Stream Cached (100ms) → Total: ~0.1s

Speed Improvement: 27x faster
```

### Rate Limit Protection

AI providers have rate limits (requests/minute). Caching helps:

```
Without Cache: 1000 identical requests = 1000 API calls → Rate limit errors
With Cache: 1000 identical requests = 1 API call + 999 cache hits → No errors
```

---

## API Integration

### Request Flow

```typescript
// Frontend sends SSE request
const eventSource = new EventSource('/api/chat/stream', {
  method: 'POST',
  body: JSON.stringify({
    modelId: 'gpt-4-turbo',
    prompt: 'Hello, world!'
  })
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'cache_hit':
      console.log('Response from cache!');
      break;
      
    case 'chunk':
      appendToUI(data.data.content);
      break;
      
    case 'complete':
      console.log('Done!', data.data.fromCache ? 'from cache' : 'from AI');
      eventSource.close();
      break;
  }
};
```

### Event Types

1. **cache_hit** (cache only)
   ```typescript
   { type: 'cache_hit', data: { cached: true } }
   ```

2. **chunk** (both cache and AI)
   ```typescript
   { type: 'chunk', data: { content: 'Hello' } }
   ```

3. **complete** (both)
   ```typescript
   {
     type: 'complete',
     data: {
       messageId: 'msg_abc123',
       fullResponse: 'Complete response text...',
       fromCache: true // or false
     }
   }
   ```

---

## Cache Management

### Manual Cache Operations

```typescript
import { ChatCacheService } from './chat/chat-cache.service';

// Inject in controller or service
constructor(private chatCache: ChatCacheService) {}

// Get cached response
const cached = await this.chatCache.getCachedResponse('gpt-4', 'Hello');

// Invalidate specific cache entry
await this.chatCache.invalidateCache('gpt-4', 'Hello');

// Clear all cache
await this.chatCache.clearAllCache();

// Get cache statistics
const stats = await this.chatCache.getCacheStats();
console.log(stats); // { totalKeys: 150, cachePrefix: 'chat:cache:', ttl: 3600 }
```

### Admin Endpoints (Optional)

Create admin routes to manage cache:

```typescript
// src/chat/chat.controller.ts
@Get('cache/stats')
@UseGuards(JwtAuthGuard, AdminGuard)
async getCacheStats() {
  return this.chatCache.getCacheStats();
}

@Delete('cache/clear')
@UseGuards(JwtAuthGuard, AdminGuard)
async clearCache() {
  await this.chatCache.clearAllCache();
  return { message: 'Cache cleared successfully' };
}

@Delete('cache/:modelId/:prompt')
@UseGuards(JwtAuthGuard, AdminGuard)
async invalidateCache(
  @Param('modelId') modelId: string,
  @Param('prompt') prompt: string
) {
  await this.chatCache.invalidateCache(modelId, prompt);
  return { message: 'Cache entry invalidated' };
}
```

---

## Testing

### Unit Tests

```typescript
// src/chat/chat-cache.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatCacheService } from './chat-cache.service';

describe('ChatCacheService', () => {
  let service: ChatCacheService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatCacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ChatCacheService>(ChatCacheService);
    await service.onModuleInit();
  });

  afterAll(async () => {
    await service.clearAllCache();
    await service.onModuleDestroy();
  });

  it('should cache and retrieve response', async () => {
    const modelId = 'gpt-4';
    const prompt = 'Test prompt';
    const response = 'Test response';

    // Cache miss initially
    let cached = await service.getCachedResponse(modelId, prompt);
    expect(cached).toBeNull();

    // Set cache
    await service.setCachedResponse(modelId, prompt, response);

    // Cache hit now
    cached = await service.getCachedResponse(modelId, prompt);
    expect(cached).toBe(response);
  });

  it('should generate consistent cache keys', async () => {
    const key1 = service['generateCacheKey']('gpt-4', 'Hello');
    const key2 = service['generateCacheKey']('gpt-4', 'Hello');
    const key3 = service['generateCacheKey']('gpt-4', 'World');

    expect(key1).toBe(key2); // Same input = same key
    expect(key1).not.toBe(key3); // Different input = different key
  });

  it('should invalidate cache', async () => {
    const modelId = 'gpt-4';
    const prompt = 'Test';
    
    await service.setCachedResponse(modelId, prompt, 'Response');
    await service.invalidateCache(modelId, prompt);
    
    const cached = await service.getCachedResponse(modelId, prompt);
    expect(cached).toBeNull();
  });

  it('should get cache stats', async () => {
    await service.clearAllCache();
    await service.setCachedResponse('gpt-4', 'Test 1', 'Response 1');
    await service.setCachedResponse('gpt-4', 'Test 2', 'Response 2');

    const stats = await service.getCacheStats();
    expect(stats.totalKeys).toBe(2);
    expect(stats.ttl).toBe(3600);
  });
});
```

### Integration Tests

```typescript
// Test complete flow with cache
it('should use cache for identical requests', async () => {
  const request = {
    modelId: 'gpt-3.5-turbo',
    prompt: 'Hello AI',
  };

  // First request - cache miss
  const response1 = await chatService.streamChatResponse(request);
  let events1 = [];
  for await (const event of response1) {
    events1.push(event);
  }
  
  expect(events1.find(e => e.type === 'cache_hit')).toBeUndefined();
  expect(events1[events1.length - 1].data.fromCache).toBe(false);

  // Second request - cache hit
  const response2 = await chatService.streamChatResponse(request);
  let events2 = [];
  for await (const event of response2) {
    events2.push(event);
  }
  
  expect(events2.find(e => e.type === 'cache_hit')).toBeDefined();
  expect(events2[events2.length - 1].data.fromCache).toBe(true);
});
```

---

## Monitoring

### Redis CLI Inspection

```bash
# Connect to Redis
redis-cli

# List all chat cache keys
KEYS chat:cache:*

# Get specific cache entry
GET chat:cache:a3f5b2c1d4e5f6a7b8c9d0e1f2a3b4c5...

# Check TTL
TTL chat:cache:a3f5b2c1d4e5f6a7b8c9d0e1f2a3b4c5...

# Count total cache entries
DBSIZE

# Monitor cache operations in real-time
MONITOR
```

### Logs

ChatCacheService logs all operations:

```
[ChatCacheService] Redis client connected for chat cache
[ChatCacheService] Cache MISS for model gpt-4 (key: chat:cache:7f3e9b5c2a1d...)
[ChatCacheService] Cached response for model gpt-4 (key: chat:cache:7f3e9b5c2a1d..., size: 1234 chars, TTL: 3600s)
[ChatCacheService] Cache HIT for model gpt-4 (key: chat:cache:7f3e9b5c2a1d...)
```

### Metrics to Track

1. **Cache Hit Rate**
   ```typescript
   const hitRate = (cacheHits / totalRequests) * 100;
   // Target: >60% for common queries
   ```

2. **Average Response Time**
   ```typescript
   const avgCacheTime = 100ms;
   const avgAITime = 2500ms;
   const improvement = ((avgAITime - avgCacheTime) / avgAITime) * 100; // ~96%
   ```

3. **Cost Savings**
   ```typescript
   const savedCalls = cacheHits;
   const costPerCall = 0.03; // GPT-4 average
   const totalSavings = savedCalls * costPerCall;
   ```

---

## Best Practices

### ✅ DO

- **Use cache for stable responses**: Factual questions, code generation, translations
- **Monitor cache hit rates**: Adjust TTL based on hit rate metrics
- **Set reasonable TTLs**: Balance between freshness and cost savings
- **Log cache operations**: Track hits/misses for optimization
- **Handle cache failures gracefully**: Don't block requests on cache errors

### ❌ DON'T

- **Cache time-sensitive queries**: "What's today's date?", "Current weather"
- **Cache user-specific context**: Responses that include personal data
- **Set extremely long TTLs**: AI models improve over time
- **Cache error responses**: Only cache successful AI responses
- **Expose cache keys**: They may contain sensitive prompt data

---

## Troubleshooting

### Issue: Cache not working

**Check**:
```bash
# 1. Verify Redis is running
redis-cli ping
# Should return: PONG

# 2. Check Redis connection in logs
grep "Redis client connected" logs/api.log

# 3. Test cache manually
redis-cli
> SET test "value"
> GET test
> DEL test
```

### Issue: Memory usage too high

**Solution**:
```bash
# Check Redis memory usage
redis-cli INFO memory

# Reduce TTL in ChatCacheService
private readonly CACHE_TTL = 1800; // 30 minutes instead of 1 hour

# Or clear old cache
redis-cli FLUSHDB
```

### Issue: Cached responses outdated

**Solution**:
```typescript
// Invalidate cache when model is updated
await this.chatCache.clearAllCache();

// Or reduce TTL
private readonly CACHE_TTL = 900; // 15 minutes
```

---

## Summary

The chat caching system provides:

- ✅ **99%+ cost savings** for duplicate requests
- ✅ **27x faster responses** from cache
- ✅ **Seamless integration** with existing streaming
- ✅ **Zero-config** for basic usage
- ✅ **Production-ready** with graceful degradation

### Quick Start Checklist

- [x] Redis running on localhost:6379
- [x] ChatCacheService added to ChatModule
- [x] ChatService updated with cache checks
- [x] Environment variables configured
- [x] Logs showing cache hits/misses
- [ ] Monitor cache hit rate in production
- [ ] Adjust TTL based on usage patterns
- [ ] Add admin cache management endpoints

**Status**: ✅ Fully implemented and ready to use!
