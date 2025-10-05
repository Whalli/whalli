# BullMQ Workers Process

Separate process for handling BullMQ background jobs.

## Why Separate Workers?

Running BullMQ workers in a separate process provides several benefits:

1. **Performance**: API server remains responsive during heavy processing
2. **Scalability**: Workers can be scaled independently
3. **Reliability**: Worker failures don't affect API availability
4. **Resource Isolation**: Separate CPU/memory allocation
5. **Monitoring**: Separate logs and metrics

## Workers Included

### 1. Voice Transcription Worker

- **Queue**: `voice-transcription`
- **Processor**: `VoiceTranscriptionProcessor`
- **Task**: Transcribe audio files using OpenAI Whisper API
- **Average Duration**: 10-30 seconds per job

### 2. Recurring Search Worker

- **Queue**: `recurring-search`
- **Processor**: `RecurringSearchProcessor`
- **Task**: Execute scheduled web searches
- **Average Duration**: 5-15 seconds per job

## Development

### Start Workers Locally

```bash
# Terminal 1: Start API server
pnpm dev

# Terminal 2: Start workers
pnpm dev:workers
```

### Watch Mode

Workers support hot reload in development:

```bash
pnpm dev:workers
# Any changes to worker files will trigger rebuild
```

## Production

### Build

```bash
# Build workers only
pnpm build:workers

# Build API + workers
pnpm build:all
```

### Run

```bash
# Run workers
node dist/workers/main.js

# Or use PM2 for process management
pm2 start dist/workers/main.js --name whalli-workers
```

## Docker

### Single Instance

```bash
docker-compose up -d workers
```

### Multiple Instances (Scaling)

```bash
# Run 3 worker instances
docker-compose up -d --scale workers=3

# Run 5 worker instances
docker-compose up -d --scale workers=5
```

Each instance will process jobs from the same Redis queues, distributing the workload.

## Logs

```bash
# View worker logs
docker logs -f whalli-workers

# View logs from all worker instances
docker logs -f $(docker ps -q --filter name=whalli-workers)
```

## Monitoring

### Queue Stats

```bash
# Redis CLI
docker exec whalli-redis redis-cli

# Check queue lengths
LLEN bull:voice-transcription:waiting
LLEN bull:voice-transcription:active
LLEN bull:voice-transcription:completed
LLEN bull:voice-transcription:failed
```

### Job Processing

Workers log each job:

```
[VoiceTranscriptionProcessor] Processing transcription job 12345 for attachment abc123
[VoiceTranscriptionProcessor] Transcription complete for attachment abc123
```

### Failed Jobs

Failed jobs are logged with error details:

```
[RecurringSearchProcessor] Error processing search search123: Network timeout
```

## Configuration

Workers read environment variables from `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/whalli

# Redis (required)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# MinIO (for file storage)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# OpenAI (for Whisper API)
OPENAI_API_KEY=sk-xxx
```

## Adding New Workers

To add a new worker:

1. **Create Processor** (e.g., `src/email/email.processor.ts`):

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('email-sending')
export class EmailProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    const { to, subject, body } = job.data;
    // Send email logic
  }
}
```

2. **Register Queue** in `workers.module.ts`:

```typescript
BullModule.registerQueue(
  { name: 'voice-transcription' },
  { name: 'recurring-search' },
  { name: 'email-sending' }, // New queue
),
```

3. **Add Provider**:

```typescript
providers: [
  VoiceService,
  VoiceTranscriptionProcessor,
  RecurringSearchService,
  RecurringSearchProcessor,
  EmailService,        // New service
  EmailProcessor,      // New processor
],
```

4. **Rebuild**:

```bash
pnpm build:workers
```

## Troubleshooting

### Workers Not Processing Jobs

1. Check Redis connection:
   ```bash
   docker logs whalli-workers | grep "Redis"
   ```

2. Check queue registration:
   ```bash
   docker logs whalli-workers | grep "Workers started"
   ```

3. Check pending jobs:
   ```bash
   docker exec whalli-redis redis-cli LLEN bull:voice-transcription:waiting
   ```

### High Memory Usage

Scale workers to distribute load:

```bash
docker-compose up -d --scale workers=5
```

Or increase container memory limit in `docker-compose.yml`:

```yaml
workers:
  deploy:
    resources:
      limits:
        memory: 2G
```

### Jobs Failing

Check error logs:

```bash
docker logs whalli-workers | grep "Error"
```

Inspect failed jobs in Redis:

```bash
docker exec whalli-redis redis-cli
LRANGE bull:voice-transcription:failed 0 -1
```

## Performance

### Benchmarks

| Worker | Avg Duration | Concurrency | Throughput |
|--------|--------------|-------------|------------|
| Voice Transcription | 15s | 10 | 40 jobs/min |
| Recurring Search | 8s | 20 | 150 jobs/min |

### Optimization Tips

1. **Scale horizontally**: Run multiple worker instances
2. **Increase concurrency**: Adjust BullMQ concurrency settings
3. **Add caching**: Cache frequently accessed data
4. **Optimize queries**: Use database indexes
5. **Batch processing**: Process similar jobs together

## Resources

- **Documentation**: `../RATE_LIMIT_WORKERS.md`
- **BullMQ Docs**: https://docs.bullmq.io/
- **Redis Docs**: https://redis.io/docs/
