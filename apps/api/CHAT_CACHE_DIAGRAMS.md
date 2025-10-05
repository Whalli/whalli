# Chat Cache System - Visual Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Chat Cache System Architecture                    │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│   Frontend   │────────>│ ChatService  │────────>│  Redis Cache │
│   (React)    │  HTTP   │  (NestJS)    │  Check  │  (ioredis)   │
│              │  SSE    │              │  Cache  │              │
└──────────────┘         └──────────────┘         └──────────────┘
                                │                         │
                                │                         │
                                │ Cache Miss              │ Cache Hit
                                ↓                         ↓
                         ┌──────────────┐         ┌──────────────┐
                         │              │         │              │
                         │ AI Provider  │         │   Stream     │
                         │ (OpenAI/     │         │   Cached     │
                         │  Anthropic)  │         │   Response   │
                         │              │         │              │
                         └──────────────┘         └──────────────┘
                                │                         │
                                │                         │
                                └─────────┬───────────────┘
                                          ↓
                                   ┌──────────────┐
                                   │              │
                                   │   Postgres   │
                                   │   Database   │
                                   │  (Prisma)    │
                                   │              │
                                   └──────────────┘
```

## Request Flow - Cache Hit (Fast Path)

```
User Request (2nd time)
     │
     ↓
┌────────────────────────────────────────────────────────────┐
│ 1. Generate Cache Key                                      │
│    Input: "gpt-4" + "What is AI?"                          │
│    Output: "chat:cache:7f3e9b5c2a1d..."                    │
│    Time: <1ms                                               │
└────────────────────────────────────────────────────────────┘
     │
     ↓
┌────────────────────────────────────────────────────────────┐
│ 2. Check Redis Cache                                       │
│    Command: GET chat:cache:7f3e9b5c2a1d...                 │
│    Result: FOUND ✅                                         │
│    Time: 5ms                                                │
└────────────────────────────────────────────────────────────┘
     │
     ↓
┌────────────────────────────────────────────────────────────┐
│ 3. Stream Cached Response                                  │
│    Method: Character-by-character with 10ms delay          │
│    Speed: ~100 chars/second                                 │
│    Time: ~100ms (for 1000 char response)                   │
└────────────────────────────────────────────────────────────┘
     │
     ↓
┌────────────────────────────────────────────────────────────┐
│ 4. Save Message to Database                                │
│    Query: INSERT INTO messages (userId, content, ...)      │
│    Time: 10ms                                               │
└────────────────────────────────────────────────────────────┘
     │
     ↓
   Response Complete
   Total Time: ~115ms ⚡
   Cost: $0.00 💰
   API Calls: 0 🎯
```

## Request Flow - Cache Miss (Slow Path)

```
User Request (1st time)
     │
     ↓
┌────────────────────────────────────────────────────────────┐
│ 1. Generate Cache Key                                      │
│    Input: "gpt-4" + "What is AI?"                          │
│    Output: "chat:cache:7f3e9b5c2a1d..."                    │
│    Time: <1ms                                               │
└────────────────────────────────────────────────────────────┘
     │
     ↓
┌────────────────────────────────────────────────────────────┐
│ 2. Check Redis Cache                                       │
│    Command: GET chat:cache:7f3e9b5c2a1d...                 │
│    Result: NOT FOUND ❌                                     │
│    Time: 5ms                                                │
└────────────────────────────────────────────────────────────┘
     │
     ↓
┌────────────────────────────────────────────────────────────┐
│ 3. Call AI Provider API                                    │
│    Provider: OpenAI GPT-4                                   │
│    Method: Streaming completion                             │
│    Time: 2000-5000ms ⏱️                                     │
└────────────────────────────────────────────────────────────┘
     │
     ↓
┌────────────────────────────────────────────────────────────┐
│ 4. Stream Response to Client                               │
│    Method: Server-Sent Events (SSE)                         │
│    Stream: Real-time chunks as they arrive                  │
│    Time: Included in step 3                                 │
└────────────────────────────────────────────────────────────┘
     │
     ↓
┌────────────────────────────────────────────────────────────┐
│ 5. Store Complete Response in Redis                        │
│    Command: SETEX chat:cache:7f3e9b5c2a1d... 3600 "..."   │
│    TTL: 3600 seconds (1 hour)                               │
│    Time: 5ms                                                │
└────────────────────────────────────────────────────────────┘
     │
     ↓
┌────────────────────────────────────────────────────────────┐
│ 6. Save Messages to Database                               │
│    Queries: INSERT user message + assistant message        │
│    Time: 20ms                                               │
└────────────────────────────────────────────────────────────┘
     │
     ↓
   Response Complete
   Total Time: ~2500ms 🐌
   Cost: $0.03 💸
   API Calls: 1 📞
```

## Cache Key Generation Flow

```
Input: modelId + prompt
   │
   ↓
┌─────────────────────────────────────┐
│ Concatenate with separator          │
│ "gpt-4:What is AI?"                 │
└─────────────────────────────────────┘
   │
   ↓
┌─────────────────────────────────────┐
│ SHA-256 Hash                        │
│ createHash('sha256')                │
│   .update(combined)                 │
│   .digest('hex')                    │
└─────────────────────────────────────┘
   │
   ↓
┌─────────────────────────────────────┐
│ Add Prefix                          │
│ "chat:cache:" + hash                │
└─────────────────────────────────────┘
   │
   ↓
Output: chat:cache:7f3e9b5c2a1d4f6e...
        (12 + 64 = 76 characters)
```

## Performance Comparison Timeline

```
First Request (Cache Miss):
├─ 0ms      │ Request received
├─ 5ms      │ Cache check (miss)
├─ 10ms     │ User message saved to DB
├─ 2510ms   │ AI provider call + streaming
├─ 2515ms   │ Response cached in Redis
├─ 2525ms   │ Assistant message saved to DB
└─ 2525ms   │ ✅ Response complete

Second Request (Cache Hit):
├─ 0ms      │ Request received
├─ 5ms      │ Cache check (hit) ✨
├─ 15ms     │ User message saved to DB
├─ 115ms    │ Cached response streamed
├─ 125ms    │ Assistant message saved to DB
└─ 125ms    │ ✅ Response complete

Speed Improvement: 2525ms → 125ms (95% faster, 20x improvement)
```

## Cost Analysis Per 1000 Requests

```
Scenario: 1000 users ask "What is AI?" to GPT-4

Without Cache:
┌─────────────────────────────────────────────────────────┐
│ Metric              │ Value                             │
├─────────────────────────────────────────────────────────┤
│ API Calls           │ 1000                              │
│ Total Tokens        │ ~500,000 (input + output)         │
│ Cost per Request    │ $0.03                             │
│ Total Cost          │ $30.00                            │
│ Avg Response Time   │ 2500ms                            │
│ Total Processing    │ 2,500,000ms = 41.7 minutes        │
└─────────────────────────────────────────────────────────┘

With Cache (99% hit rate):
┌─────────────────────────────────────────────────────────┐
│ Metric              │ Value                             │
├─────────────────────────────────────────────────────────┤
│ API Calls           │ 1 (first request only)            │
│ Cache Hits          │ 999                               │
│ Total Tokens        │ ~500 (input + output, 1st only)   │
│ Cost (AI)           │ $0.03 (first request)             │
│ Cost (Redis)        │ $0.00 (included in hosting)       │
│ Total Cost          │ $0.03                             │
│ Avg Response Time   │ 125ms                             │
│ Total Processing    │ 2,500ms + 124,875ms = 127s        │
└─────────────────────────────────────────────────────────┘

💰 Savings:
- Cost Reduction: $29.97 (99.9%)
- Time Saved: 41.7 min → 2.1 min (95%)
- API Load Reduction: 1000 calls → 1 call (99.9%)
```

## Redis Memory Usage Estimation

```
Cache Entry Breakdown:
┌─────────────────────────────────────────────┐
│ Component       │ Size                      │
├─────────────────────────────────────────────┤
│ Key             │ 76 bytes (prefix + hash)  │
│ Response (avg)  │ 1000 bytes (~200 words)   │
│ Redis Overhead  │ ~100 bytes                │
├─────────────────────────────────────────────┤
│ Total per Entry │ ~1.2 KB                   │
└─────────────────────────────────────────────┘

Cache Size Calculations:
┌─────────────────────────────────────────────┐
│ Entries   │ Memory Usage                    │
├─────────────────────────────────────────────┤
│ 100       │ 120 KB                          │
│ 1,000     │ 1.2 MB                          │
│ 10,000    │ 12 MB                           │
│ 100,000   │ 120 MB                          │
│ 1,000,000 │ 1.2 GB                          │
└─────────────────────────────────────────────┘

Note: With 1-hour TTL, most production systems stay under 10,000 entries
```

## Cache Event Sequence Diagram

```
Client                ChatService          ChatCacheService       Redis           AI Provider
  │                        │                      │                │                   │
  │─────Request────────────>│                     │                │                   │
  │  (modelId, prompt)      │                     │                │                   │
  │                         │                     │                │                   │
  │                         │─────getCached───────>│               │                   │
  │                         │                      │──GET key──────>│                  │
  │                         │                      │<──NULL─────────│                  │
  │                         │<────null─────────────│                │                   │
  │                         │                      │                │                   │
  │                         │─────────────────────────streamChat────────────────────────>│
  │                         │                      │                │                   │
  │<────chunk 1─────────────│<───────────────────────────────────────────chunk 1───────│
  │<────chunk 2─────────────│<───────────────────────────────────────────chunk 2───────│
  │<────chunk n─────────────│<───────────────────────────────────────────chunk n───────│
  │                         │                      │                │                   │
  │                         │─────setCache─────────>│               │                   │
  │                         │  (modelId, prompt,   │──SETEX────────>│                  │
  │                         │   fullResponse)      │  TTL=3600      │                   │
  │                         │                      │<──OK───────────│                  │
  │                         │<────void─────────────│                │                   │
  │                         │                      │                │                   │
  │<────complete────────────│                      │                │                   │
  │  (fromCache: false)     │                      │                │                   │


Second Request (Cache Hit):

Client                ChatService          ChatCacheService       Redis
  │                        │                      │                │
  │─────Request────────────>│                     │                │
  │  (modelId, prompt)      │                     │                │
  │  [SAME AS BEFORE]       │                     │                │
  │                         │                     │                │
  │                         │─────getCached───────>│               │
  │                         │                      │──GET key──────>│
  │                         │                      │<──response────│ ✨ CACHE HIT
  │                         │<────response─────────│                │
  │                         │                      │                │
  │<────cache_hit───────────│                      │                │
  │<────chunk 1─────────────│ (simulated)         │                │
  │<────chunk 2─────────────│ (10ms delay)        │                │
  │<────chunk n─────────────│ (per char)          │                │
  │<────complete────────────│                      │                │
  │  (fromCache: true) ✨   │                      │                │
```

## Cache Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                     Cache Entry Lifecycle                    │
└─────────────────────────────────────────────────────────────┘

1. CREATION (Cache Miss)
   ├─ User sends request
   ├─ Cache check returns null
   ├─ AI provider generates response
   ├─ Response stored in Redis with TTL=3600s
   └─ Entry created: chat:cache:abc123...

2. ACTIVE (Within 1 hour)
   ├─ TTL countdown: 3600s → 3599s → 3598s → ...
   ├─ Cache hits serve stored response
   ├─ Each hit does NOT reset TTL
   └─ Memory: 1.2 KB (average)

3. EXPIRATION (After 1 hour)
   ├─ TTL reaches 0
   ├─ Redis automatically removes entry
   ├─ Next request becomes cache miss
   └─ Cycle repeats from step 1

4. MANUAL INVALIDATION (Optional)
   ├─ Admin triggers clearAllCache()
   ├─ Or invalidateCache(modelId, prompt)
   ├─ Entry immediately deleted
   └─ Next request becomes cache miss

Timeline:
0s        600s      1200s     1800s     2400s     3000s     3600s
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ CREATED │  50min  │  40min  │  30min  │  20min  │  10min  │ EXPIRED
│ Active  │ Active  │ Active  │ Active  │ Active  │ Active  │ Deleted
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

## Multi-User Scenario

```
User A: "What is AI?" → GPT-4
  ├─ Cache Miss (first request)
  ├─ AI call: 2500ms, Cost: $0.03
  └─ Cached for 1 hour

User B: "What is AI?" → GPT-4 (5 minutes later)
  ├─ Cache Hit ✨
  ├─ Response: 125ms, Cost: $0.00
  └─ Same cached response

User C: "What is AI?" → GPT-4 (30 minutes later)
  ├─ Cache Hit ✨
  ├─ Response: 125ms, Cost: $0.00
  └─ Same cached response

User D: "What is AI?" → Claude-3-Opus (different model)
  ├─ Cache Miss (different model = different key)
  ├─ AI call: 2500ms, Cost: $0.015
  └─ Cached separately

User E: "What is ML?" → GPT-4 (different prompt)
  ├─ Cache Miss (different prompt = different key)
  ├─ AI call: 2500ms, Cost: $0.03
  └─ Cached separately

Summary for "What is AI?" on GPT-4:
- Total Users: 3 (A, B, C)
- API Calls: 1 (only User A)
- Total Cost: $0.03 (saved $0.06)
- Cache Hit Rate: 66.7%
```

## System Metrics Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                   Real-Time Cache Metrics                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Cache Hit Rate:  ████████████████░░░░  78%                 │
│  Cache Miss Rate: ████░░░░░░░░░░░░░░░░  22%                 │
│                                                              │
│  Total Requests:        1,247                                │
│  Cache Hits:              973                                │
│  Cache Misses:            274                                │
│                                                              │
│  Avg Response Time (Hit):   115ms  ⚡                        │
│  Avg Response Time (Miss): 2,534ms 🐌                       │
│                                                              │
│  Total Cache Entries:      1,054                             │
│  Memory Usage:            1.23 MB                            │
│                                                              │
│  Cost Savings Today:     $29.19                              │
│  API Calls Saved:          973                               │
│                                                              │
│  Top Cached Queries:                                         │
│    1. "What is AI?" (GPT-4)         - 156 hits              │
│    2. "Explain Python" (GPT-4)      - 89 hits               │
│    3. "Write a function" (Claude)   - 67 hits               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Visual Summary**: Cache provides 20x faster responses and 99% cost savings for duplicate requests!
