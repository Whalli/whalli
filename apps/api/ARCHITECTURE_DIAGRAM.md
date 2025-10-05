# Rate Limiting & Workers - Visual Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                     │
│  (Browser, Mobile App, API Client)                                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTP Request
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       TRAEFIK (Load Balancer)                           │
│  - SSL Termination                                                      │
│  - Reverse Proxy                                                        │
│  - Health Checks                                                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API SERVER (NestJS)                             │
│  Port: 3001                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │           RATE LIMIT GUARD (Global)                     │           │
│  │                                                          │           │
│  │  1. Extract user ID or IP address                       │           │
│  │  2. Check @SkipRateLimit() decorator → Skip if true     │           │
│  │  3. Get custom @RateLimit() config (if any)             │           │
│  │  4. Query Redis: GET rate_limit:{user|ip}:{window}      │           │
│  │  5. Check count < limit                                 │           │
│  │     ├─ YES → Increment count → Allow (200)              │           │
│  │     └─ NO → Reject (429 Too Many Requests)              │           │
│  │  6. Set response headers (X-RateLimit-*)                │           │
│  └─────────────────────────────────────────────────────────┘           │
│                          ↓                                              │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │              CONTROLLERS                                │           │
│  │                                                          │           │
│  │  - ChatController (30 req/min)                          │           │
│  │  - VoiceController (enqueue transcription)              │           │
│  │  - FilesController (10 uploads/hour)                    │           │
│  │  - WebhooksController (@SkipRateLimit)                  │           │
│  └─────────────────────────────────────────────────────────┘           │
│                          ↓                                              │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │              SERVICES                                   │           │
│  │                                                          │           │
│  │  - VoiceService.uploadAudio()                           │           │
│  │    → Enqueue job to Redis                               │           │
│  │  - RecurringSearchService.scheduleJob()                 │           │
│  │    → Schedule repeatable job                            │           │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Enqueue Jobs
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        REDIS (Port 6379)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │         RATE LIMITING KEYS (TTL)                        │           │
│  │                                                          │           │
│  │  rate_limit:user:abc123:60 = "95" (TTL: 45s)           │           │
│  │  rate_limit:user:xyz789:60 = "12" (TTL: 58s)           │           │
│  │  rate_limit:ip:192.168.1.1:60 = "18" (TTL: 30s)        │           │
│  │  rate_limit:ip:10.0.0.5:60 = "5" (TTL: 50s)            │           │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │         BULLMQ QUEUES                                   │           │
│  │                                                          │           │
│  │  bull:voice-transcription:waiting    [Job 1, Job 2]    │           │
│  │  bull:voice-transcription:active     [Job 3]           │           │
│  │  bull:voice-transcription:completed  [Job 4, Job 5]    │           │
│  │  bull:voice-transcription:failed     []                │           │
│  │                                                          │           │
│  │  bull:recurring-search:waiting       [Job A]           │           │
│  │  bull:recurring-search:active        [Job B]           │           │
│  │  bull:recurring-search:completed     [Job C, Job D]    │           │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Poll Jobs
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    WORKERS PROCESS (Separate Container)                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │    VOICE TRANSCRIPTION WORKER                           │           │
│  │                                                          │           │
│  │  Queue: voice-transcription                             │           │
│  │  Concurrency: 10                                        │           │
│  │                                                          │           │
│  │  Process Job:                                           │           │
│  │  1. Download audio from MinIO                           │           │
│  │  2. Call OpenAI Whisper API                             │           │
│  │  3. Get transcript text                                 │           │
│  │  4. Create Message in database                          │           │
│  │  5. Update Attachment metadata                          │           │
│  │  6. Mark job as completed                               │           │
│  │                                                          │           │
│  │  Avg Duration: 10-30 seconds                            │           │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │    RECURRING SEARCH WORKER                              │           │
│  │                                                          │           │
│  │  Queue: recurring-search                                │           │
│  │  Concurrency: 20                                        │           │
│  │                                                          │           │
│  │  Process Job:                                           │           │
│  │  1. Fetch RecurringSearch config                        │           │
│  │  2. Execute web search                                  │           │
│  │  3. Parse and format results                            │           │
│  │  4. Store in SearchResult table                         │           │
│  │  5. Update lastExecutedAt                               │           │
│  │  6. Mark job as completed                               │           │
│  │                                                          │           │
│  │  Avg Duration: 5-15 seconds                             │           │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  SCALING: Can run multiple worker instances                     │  │
│  │  docker-compose up -d --scale workers=3                         │  │
│  │                                                                  │  │
│  │  Instance 1 ──┐                                                 │  │
│  │  Instance 2 ──┼── All poll from same Redis queues              │  │
│  │  Instance 3 ──┘    (automatic load distribution)               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Rate Limiting Flow

```
Client Request
     │
     ▼
┌──────────────────────────────────────┐
│   RateLimitGuard.canActivate()       │
└──────────────────┬───────────────────┘
                   │
                   ▼
          Check @SkipRateLimit()
                   │
        ┌──────────┴───────────┐
        │                      │
       YES                    NO
        │                      │
        ▼                      ▼
    Allow (200)      Get rate limit config
                              │
                              ▼
                    Redis: GET rate_limit:{id}:{window}
                              │
                              ▼
                          Count ≥ Limit?
                              │
                   ┌──────────┴───────────┐
                   │                      │
                  YES                    NO
                   │                      │
                   ▼                      ▼
              Reject (429)         Redis: INCR count
                   │                      │
                   │                      ▼
                   │               Set headers
                   │                      │
                   │                      ▼
                   │                 Allow (200)
                   │                      │
                   └──────────────────────┘
```

---

## Data Flow: Audio Upload → Transcription

```
1. Client Uploads Audio
   │
   ▼
2. API: VoiceController.uploadAudio()
   │
   ├─ Upload to MinIO
   │
   ├─ Create Attachment record
   │
   └─ Enqueue job to Redis
      │
      ▼
3. Redis: bull:voice-transcription:waiting
   │
   │  [Job Data]
   │  {
   │    attachmentId: "att123",
   │    audioUrl: "https://minio/audio/file.mp3",
   │    userId: "user456"
   │  }
   │
   ▼
4. Workers: VoiceTranscriptionProcessor.process()
   │
   ├─ Download audio from MinIO
   │
   ├─ Call OpenAI Whisper API
   │
   ├─ Get transcript: "Hello, this is a test..."
   │
   ├─ Create Message in database
   │
   └─ Update Attachment.metadata
      {
        transcriptionStatus: "completed",
        transcript: "Hello, this is a test...",
        transcribedAt: "2025-10-05T12:00:00Z"
      }
      │
      ▼
5. Job Marked as Completed
   │
   ▼
6. Client Polls for Status
   │
   GET /api/voice/status/:attachmentId
   │
   ▼
7. Returns Transcript
```

---

## Redis Keys Structure

### Rate Limiting

```
rate_limit:user:abc123:60      → "95"  (TTL: 45s)
rate_limit:user:xyz789:60      → "12"  (TTL: 58s)
rate_limit:user:def456:3600    → "5"   (TTL: 3500s)
rate_limit:ip:192.168.1.1:60   → "18"  (TTL: 30s)
rate_limit:ip:10.0.0.5:60      → "5"   (TTL: 50s)
```

**Pattern**: `rate_limit:{type}:{identifier}:{windowSeconds}`
- `type`: "user" or "ip"
- `identifier`: User ID or IP address
- `windowSeconds`: Time window (60, 3600, 86400, etc.)

### BullMQ Queues

```
bull:voice-transcription:id           → Job metadata
bull:voice-transcription:waiting      → List of pending jobs
bull:voice-transcription:active       → List of processing jobs
bull:voice-transcription:completed    → List of completed jobs
bull:voice-transcription:failed       → List of failed jobs
bull:voice-transcription:delayed      → List of delayed jobs
bull:voice-transcription:repeat:*     → Repeatable job metadata

bull:recurring-search:id              → Job metadata
bull:recurring-search:waiting         → List of pending jobs
bull:recurring-search:active          → List of processing jobs
bull:recurring-search:completed       → List of completed jobs
bull:recurring-search:failed          → List of failed jobs
```

---

## Deployment Architecture

### Development (3 Processes)

```
Terminal 1: API Server
   ├─ HTTP Server (Port 3001)
   ├─ RateLimitGuard
   └─ Job Enqueueing

Terminal 2: Workers
   ├─ Voice Transcription Worker
   └─ Recurring Search Worker

Terminal 3: Redis
   └─ Port 6379
```

### Production (Docker Compose)

```
Docker Network: whalli-network

┌─────────────────────┐
│   Traefik (Proxy)   │
│   Ports: 80, 443    │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│   API   │   │   Web   │   │  Admin  │
│  :3001  │   │  :3000  │   │  :3002  │
└────┬────┘   └─────────┘   └─────────┘
     │
     │
     ▼
┌──────────────────────────────────┐
│  Workers (Scalable)              │
│  docker-compose up --scale=3     │
│                                  │
│  ┌─────────┐ ┌─────────┐ ┌────────┐
│  │Worker 1 │ │Worker 2 │ │Worker 3│
│  └─────────┘ └─────────┘ └────────┘
└─────────────┬────────────────────┘
              │
              ▼
     ┌─────────────────┐
     │  Redis :6379    │
     └─────────────────┘
              │
              ▼
     ┌─────────────────┐
     │ PostgreSQL      │
     │  :5432          │
     └─────────────────┘
```

---

## Monitoring Dashboard

### Prometheus Metrics

```
# Rate Limiting
http_requests_rate_limited_total{endpoint="/api/chat/message"}
http_requests_rate_limit_checks_total{endpoint="/api/chat/message"}

# BullMQ Workers
bullmq_job_duration_seconds{queue="voice-transcription"}
bullmq_jobs_completed_total{queue="voice-transcription"}
bullmq_jobs_failed_total{queue="voice-transcription"}
bullmq_queue_waiting{queue="voice-transcription"}
bullmq_queue_active{queue="voice-transcription"}
```

### Grafana Panels

```
┌─────────────────────────────────────────────────────────────┐
│ Rate Limiting Dashboard                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │ Total Requests │  │ Rate Limited   │  │ Hit Rate %   │ │
│  │   1,234,567    │  │     5,432      │  │    0.44%     │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Rate Limited Requests Over Time                      │  │
│  │                                                      │  │
│  │  100 ┤                      ╭─╮                     │  │
│  │   80 ┤                 ╭────╯ ╰─╮                   │  │
│  │   60 ┤            ╭────╯        ╰───╮               │  │
│  │   40 ┤       ╭────╯                 ╰───╮           │  │
│  │   20 ┤   ╭───╯                          ╰───╮       │  │
│  │    0 ┴───┴───────────────────────────────────┴───   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Top Rate Limited Endpoints                           │  │
│  │                                                      │  │
│  │  /api/chat/message          ████████████ 1,234      │  │
│  │  /api/files/upload          ████████     892        │  │
│  │  /api/search/query          █████        543        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Workers Dashboard                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │ Jobs Waiting   │  │ Jobs Active    │  │ Jobs/Min     │ │
│  │      45        │  │      12        │  │     120      │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Job Processing Duration (p95)                        │  │
│  │                                                      │  │
│  │  Voice Transcription:  ████████████████ 18.5s       │  │
│  │  Recurring Search:     ████████ 9.2s                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Worker Instances (3 total)                           │  │
│  │                                                      │  │
│  │  Worker 1:  █████████████ 45%  (Active)             │  │
│  │  Worker 2:  ██████████████ 52% (Active)             │  │
│  │  Worker 3:  ███████████ 38%    (Active)             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

**Status**: ✅ Complete  
**Documentation**: See `RATE_LIMIT_WORKERS.md` for full details
