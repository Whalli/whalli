# Recurring Search System - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [BullMQ Integration](#bullmq-integration)
6. [Scheduling Options](#scheduling-options)
7. [WebSearchAdapter](#websearchadapter)
8. [Production Integration](#production-integration)
9. [Testing Guide](#testing-guide)
10. [Security & Permissions](#security--permissions)
11. [Examples](#examples)

---

## Overview

The **Recurring Search System** allows users to create scheduled web searches that automatically execute at specified intervals. Search results are persisted to the database for historical tracking and analysis.

### Key Features

- ✅ **Flexible Scheduling**: Supports both cron expressions and hourly intervals
- ✅ **BullMQ Job Queue**: Reliable background processing with Redis
- ✅ **Search History**: All results stored in database with timestamps
- ✅ **Manual Execution**: Trigger searches on-demand via API
- ✅ **User-Scoped**: Each user manages their own searches
- ✅ **Active/Inactive Toggle**: Pause/resume searches without deletion
- ✅ **Extensible Search**: Adapter pattern for multiple search providers
- ✅ **Result Metadata**: Store structured JSON results with counts

---

## Architecture

### Component Overview

```
┌─────────────────────┐
│                     │
│  RecurringSearch    │◄──── User creates search with interval
│  Controller         │
│                     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│                     │
│  RecurringSearch    │──┐
│  Service            │  │
│                     │  │  Schedules BullMQ job
└─────────┬───────────┘  │
          │              │
          │              ▼
          │    ┌──────────────────┐
          │    │                  │
          │    │  BullMQ Queue    │
          │    │  (Redis)         │
          │    │                  │
          │    └────────┬─────────┘
          │             │
          │             │  Job triggers at interval
          │             │
          │             ▼
          │    ┌──────────────────┐
          │    │                  │
          │    │  RecurringSearch │
          │    │  Processor       │
          │    │                  │
          │    └────────┬─────────┘
          │             │
          │             │  Calls executeSearch()
          │             │
          ▼             ▼
┌─────────────────────────┐
│                         │
│  WebSearchAdapter       │──► Performs web search
│  (stub/production)      │
│                         │
└────────────┬────────────┘
             │
             │  Returns SearchResult[]
             │
             ▼
    ┌────────────────┐
    │                │
    │  SearchResult  │──► Stored in database
    │  (Prisma)      │
    │                │
    └────────────────┘
```

### Data Flow

1. **Creation**: User creates `RecurringSearch` via POST `/api/recurring-searches`
2. **Scheduling**: Service calculates `nextRunAt` and schedules BullMQ repeatable job
3. **Execution**: BullMQ triggers processor at scheduled time
4. **Search**: Processor calls `WebSearchAdapter.search(query)`
5. **Storage**: Results saved to `SearchResult` table with JSON data
6. **Update**: `RecurringSearch` updated with `lastRunAt` and new `nextRunAt`

---

## Database Schema

### RecurringSearch Model

```prisma
model RecurringSearch {
  id            String         @id @default(cuid())
  userId        String
  query         String
  intervalType  String         // 'cron' or 'hours'
  intervalValue String         // Cron expression or number
  isActive      Boolean        @default(true)
  lastRunAt     DateTime?
  nextRunAt     DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  results       SearchResult[]
  
  @@index([userId])
  @@index([isActive])
  @@index([nextRunAt])
}
```

### SearchResult Model

```prisma
model SearchResult {
  id                 String           @id @default(cuid())
  recurringSearchId  String
  query              String
  results            Json             // Array of SearchResult objects
  resultCount        Int
  executedAt         DateTime         @default(now())
  
  recurringSearch    RecurringSearch  @relation(fields: [recurringSearchId], references: [id], onDelete: Cascade)
  
  @@index([recurringSearchId])
  @@index([executedAt])
}
```

### Relationships

- **User → RecurringSearch**: One-to-many (user can have multiple searches)
- **RecurringSearch → SearchResult**: One-to-many (search has many results over time)

### Indexes

- `userId`: Fast lookup of user's searches
- `isActive`: Filter active/inactive searches
- `nextRunAt`: Efficient job scheduling queries
- `recurringSearchId`: Fast result lookup per search
- `executedAt`: Chronological result ordering

---

## API Endpoints

### Base URL: `/api/recurring-searches`

All endpoints require authentication via JWT (Authorization header).

---

### 1. Create Recurring Search

**POST** `/api/recurring-searches`

Creates a new recurring search and schedules the first execution.

#### Request Body

```json
{
  "query": "NestJS best practices",
  "intervalType": "hours",
  "intervalValue": "6"
}
```

Or with cron:

```json
{
  "query": "daily tech news",
  "intervalType": "cron",
  "intervalValue": "0 9 * * *"
}
```

#### Response (201 Created)

```json
{
  "id": "cljk1x2y40000xyz...",
  "userId": "user123",
  "query": "NestJS best practices",
  "intervalType": "hours",
  "intervalValue": "6",
  "isActive": true,
  "lastRunAt": null,
  "nextRunAt": "2025-03-10T12:00:00.000Z",
  "createdAt": "2025-03-10T06:00:00.000Z",
  "updatedAt": "2025-03-10T06:00:00.000Z"
}
```

#### Validation Rules

- `query`: Required, non-empty string
- `intervalType`: Must be 'cron' or 'hours'
- `intervalValue`: 
  - For 'hours': String number (e.g., "1", "6", "24")
  - For 'cron': Valid cron expression (e.g., "0 9 * * *")

---

### 2. List Recurring Searches

**GET** `/api/recurring-searches`

Returns all recurring searches for the authenticated user, with their last 5 results.

#### Response (200 OK)

```json
[
  {
    "id": "cljk1x2y40000xyz...",
    "userId": "user123",
    "query": "NestJS best practices",
    "intervalType": "hours",
    "intervalValue": "6",
    "isActive": true,
    "lastRunAt": "2025-03-10T12:00:00.000Z",
    "nextRunAt": "2025-03-10T18:00:00.000Z",
    "createdAt": "2025-03-10T06:00:00.000Z",
    "updatedAt": "2025-03-10T12:00:00.000Z",
    "results": [
      {
        "id": "result1",
        "query": "NestJS best practices",
        "resultCount": 10,
        "executedAt": "2025-03-10T12:00:00.000Z"
      },
      {
        "id": "result2",
        "query": "NestJS best practices",
        "resultCount": 12,
        "executedAt": "2025-03-10T06:00:00.000Z"
      }
    ]
  }
]
```

---

### 3. Get Single Recurring Search

**GET** `/api/recurring-searches/:id`

Returns a specific recurring search with its last 10 results.

#### Response (200 OK)

```json
{
  "id": "cljk1x2y40000xyz...",
  "userId": "user123",
  "query": "NestJS best practices",
  "intervalType": "hours",
  "intervalValue": "6",
  "isActive": true,
  "lastRunAt": "2025-03-10T12:00:00.000Z",
  "nextRunAt": "2025-03-10T18:00:00.000Z",
  "createdAt": "2025-03-10T06:00:00.000Z",
  "updatedAt": "2025-03-10T12:00:00.000Z",
  "results": [
    {
      "id": "result1",
      "recurringSearchId": "cljk1x2y40000xyz...",
      "query": "NestJS best practices",
      "results": [
        {
          "title": "NestJS Best Practices 2025",
          "url": "https://example.com/nestjs-2025",
          "snippet": "Comprehensive guide to NestJS best practices...",
          "source": "example.com",
          "publishedDate": "2025-03-01"
        }
      ],
      "resultCount": 10,
      "executedAt": "2025-03-10T12:00:00.000Z"
    }
  ]
}
```

#### Error Responses

- **404 Not Found**: Search doesn't exist
- **403 Forbidden**: Search belongs to another user

---

### 4. Update Recurring Search

**PUT** `/api/recurring-searches/:id`

Updates search parameters and reschedules if interval changed.

#### Request Body (all fields optional)

```json
{
  "query": "Updated NestJS patterns",
  "intervalType": "hours",
  "intervalValue": "12",
  "isActive": false
}
```

#### Response (200 OK)

```json
{
  "id": "cljk1x2y40000xyz...",
  "query": "Updated NestJS patterns",
  "intervalType": "hours",
  "intervalValue": "12",
  "isActive": false,
  "nextRunAt": "2025-03-10T18:00:00.000Z",
  "updatedAt": "2025-03-10T12:30:00.000Z"
}
```

#### Notes

- Changing `intervalType` or `intervalValue` removes old BullMQ job and creates new one
- Setting `isActive: false` removes job from queue
- Setting `isActive: true` reschedules job

---

### 5. Delete Recurring Search

**DELETE** `/api/recurring-searches/:id`

Deletes the search and all associated results from database. Removes job from BullMQ queue.

#### Response (200 OK)

```json
{
  "message": "Recurring search deleted"
}
```

#### Cascade Deletion

- All `SearchResult` records linked to this search are deleted
- BullMQ job is removed from queue

---

### 6. Get Search Results

**GET** `/api/recurring-searches/:id/results?limit=50`

Returns paginated results for a specific recurring search.

#### Query Parameters

- `limit` (optional): Number of results to return (default: 50, max: 100)

#### Response (200 OK)

```json
[
  {
    "id": "result1",
    "recurringSearchId": "cljk1x2y40000xyz...",
    "query": "NestJS best practices",
    "results": [
      {
        "title": "NestJS Best Practices 2025",
        "url": "https://example.com/nestjs-2025",
        "snippet": "Comprehensive guide...",
        "source": "example.com",
        "publishedDate": "2025-03-01"
      },
      {
        "title": "10 NestJS Tips",
        "url": "https://dev.to/nestjs-tips",
        "snippet": "Essential tips for NestJS developers...",
        "source": "dev.to"
      }
    ],
    "resultCount": 10,
    "executedAt": "2025-03-10T12:00:00.000Z"
  },
  {
    "id": "result2",
    "recurringSearchId": "cljk1x2y40000xyz...",
    "query": "NestJS best practices",
    "results": [...],
    "resultCount": 12,
    "executedAt": "2025-03-10T06:00:00.000Z"
  }
]
```

---

### 7. Get Single Result

**GET** `/api/recurring-searches/results/:resultId`

Returns a specific search result.

#### Response (200 OK)

```json
{
  "id": "result1",
  "recurringSearchId": "cljk1x2y40000xyz...",
  "query": "NestJS best practices",
  "results": [
    {
      "title": "NestJS Best Practices 2025",
      "url": "https://example.com/nestjs-2025",
      "snippet": "Comprehensive guide to NestJS...",
      "source": "example.com",
      "publishedDate": "2025-03-01"
    }
  ],
  "resultCount": 10,
  "executedAt": "2025-03-10T12:00:00.000Z",
  "recurringSearch": {
    "id": "cljk1x2y40000xyz...",
    "query": "NestJS best practices",
    "userId": "user123"
  }
}
```

---

### 8. Execute Search Manually

**POST** `/api/recurring-searches/:id/execute`

Triggers immediate execution of a search, bypassing the schedule.

#### Response (200 OK)

```json
{
  "message": "Search executed successfully",
  "resultCount": 10
}
```

#### Use Cases

- Testing search queries before scheduling
- Forcing immediate update after search modification
- Manual refresh when needed

---

## BullMQ Integration

### Queue Configuration

The recurring search system uses BullMQ with Redis for reliable job scheduling.

#### Module Setup

```typescript
// recurring-search.module.ts
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    connection: {
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
    },
  }),
  inject: [ConfigService],
}),
BullModule.registerQueue({
  name: 'recurring-search',
})
```

### Job Structure

#### Job Name

`execute-search`

#### Job Data

```typescript
{
  searchId: string; // ID of RecurringSearch
}
```

#### Repeat Options

**For Hourly Intervals:**

```typescript
{
  repeat: {
    every: hours * 3600000, // milliseconds
  }
}
```

**For Cron Expressions:**

```typescript
{
  repeat: {
    pattern: '0 9 * * *', // 9 AM daily
  }
}
```

### Processor

```typescript
@Processor('recurring-search')
export class RecurringSearchProcessor extends WorkerHost {
  async process(job: Job<{ searchId: string }>) {
    const { searchId } = job.data;
    await this.recurringSearchService.executeSearch(searchId);
  }
}
```

### Job Management

#### Create Job

```typescript
await this.queue.add(
  'execute-search',
  { searchId: recurringSearch.id },
  {
    repeat: {
      every: hours * 3600000,
    },
    jobId: `recurring-search-${recurringSearch.id}`,
  }
);
```

#### Remove Job

```typescript
await this.queue.removeRepeatableByKey(
  `recurring-search-${searchId}:::${interval}`
);
```

---

## Scheduling Options

### Interval Types

#### 1. Hours Interval

Simple hourly scheduling for regular intervals.

**Format**: String number representing hours

**Examples**:

```json
{
  "intervalType": "hours",
  "intervalValue": "1"   // Every hour
}

{
  "intervalType": "hours",
  "intervalValue": "6"   // Every 6 hours
}

{
  "intervalType": "hours",
  "intervalValue": "24"  // Daily
}
```

**Next Run Calculation**:

```typescript
const hours = parseInt(intervalValue, 10);
const nextRun = new Date(Date.now() + hours * 3600000);
```

#### 2. Cron Expressions

Advanced scheduling using standard cron syntax.

**Format**: 5-field cron expression

```
 ┌────────── minute (0 - 59)
 │ ┌──────── hour (0 - 23)
 │ │ ┌────── day of month (1 - 31)
 │ │ │ ┌──── month (1 - 12)
 │ │ │ │ ┌── day of week (0 - 6, Sunday = 0)
 │ │ │ │ │
 * * * * *
```

**Examples**:

| Expression | Description |
|------------|-------------|
| `0 9 * * *` | Daily at 9 AM |
| `0 */6 * * *` | Every 6 hours at the top of the hour |
| `0 0 * * 0` | Weekly on Sundays at midnight |
| `0 12 1 * *` | Monthly on the 1st at noon |
| `*/30 * * * *` | Every 30 minutes |
| `0 0,12 * * *` | Twice daily (midnight and noon) |

**Next Run Calculation**:

For cron, the next run calculation requires the `cron-parser` library (production):

```typescript
import * as parser from 'cron-parser';

const interval = parser.parseExpression(intervalValue);
const nextRun = interval.next().toDate();
```

---

## WebSearchAdapter

### Adapter Pattern

The system uses an adapter pattern to abstract search providers, making it easy to switch between stub (development) and production APIs.

### Interface

```typescript
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
  publishedDate?: string;
}

@Injectable()
export class WebSearchAdapter {
  async search(query: string): Promise<SearchResult[]> {
    // Implementation
  }
}
```

### Stub Implementation (Development)

Returns mock data with simulated delay:

```typescript
async search(query: string): Promise<SearchResult[]> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return [
    {
      title: `Mock Result 1 for "${query}"`,
      url: `https://example.com/result-1`,
      snippet: `This is a mock search result for the query: ${query}`,
      source: 'example.com',
      publishedDate: new Date().toISOString(),
    },
    // ... more mock results
  ];
}
```

---

## Production Integration

### Google Custom Search API

#### Setup

1. **Get API Key**:
   - Visit [Google Cloud Console](https://console.cloud.google.com)
   - Create project → Enable Custom Search API
   - Generate API key

2. **Create Search Engine**:
   - Visit [Programmable Search Engine](https://programmablesearchengine.google.com)
   - Create new search engine
   - Get CX (Search Engine ID)

3. **Environment Variables**:

```env
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_CX=your_cx_here
```

#### Implementation

```typescript
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebSearchAdapter {
  constructor(private configService: ConfigService) {}

  async search(query: string): Promise<SearchResult[]> {
    const apiKey = this.configService.get('GOOGLE_SEARCH_API_KEY');
    const cx = this.configService.get('GOOGLE_SEARCH_CX');

    if (!apiKey || !cx) {
      throw new Error('Google Search API not configured');
    }

    const response = await axios.get(
      'https://www.googleapis.com/customsearch/v1',
      {
        params: {
          key: apiKey,
          cx: cx,
          q: query,
          num: 10,
        },
      }
    );

    return response.data.items?.map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      source: new URL(item.link).hostname,
      publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'],
    })) || [];
  }
}
```

#### Rate Limits

- **Free Tier**: 100 queries/day
- **Paid Tier**: $5 per 1,000 queries

---

### Bing Search API

#### Setup

1. **Get API Key**:
   - Visit [Azure Portal](https://portal.azure.com)
   - Create Bing Search resource
   - Copy subscription key

2. **Environment Variable**:

```env
BING_SEARCH_API_KEY=your_api_key_here
```

#### Implementation

```typescript
async search(query: string): Promise<SearchResult[]> {
  const apiKey = this.configService.get('BING_SEARCH_API_KEY');

  const response = await axios.get(
    'https://api.bing.microsoft.com/v7.0/search',
    {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
      },
      params: {
        q: query,
        count: 10,
        responseFilter: 'Webpages',
      },
    }
  );

  return response.data.webPages?.value?.map((item: any) => ({
    title: item.name,
    url: item.url,
    snippet: item.snippet,
    source: new URL(item.url).hostname,
    publishedDate: item.datePublished,
  })) || [];
}
```

#### Rate Limits

- **S1 Tier**: 1,000 transactions/month ($5/month)
- **S2-S6 Tiers**: Up to 10M transactions/month

---

### Alternative: SerpAPI

Unified API for multiple search engines (Google, Bing, Yahoo, etc.).

```typescript
const response = await axios.get('https://serpapi.com/search', {
  params: {
    engine: 'google',
    q: query,
    api_key: apiKey,
    num: 10,
  },
});
```

---

## Testing Guide

### Prerequisites

1. **Redis Running**:

```bash
docker run -d -p 6379:6379 redis:alpine
```

2. **Database Migrated**:

```bash
cd apps/api
pnpm prisma migrate dev --name add_recurring_search
```

### Manual Testing Flow

#### 1. Create Hourly Search

```bash
curl -X POST http://localhost:3001/api/recurring-searches \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "NestJS updates",
    "intervalType": "hours",
    "intervalValue": "1"
  }'
```

**Expected Response**:

```json
{
  "id": "cljk...",
  "query": "NestJS updates",
  "intervalType": "hours",
  "intervalValue": "1",
  "isActive": true,
  "nextRunAt": "2025-03-10T13:00:00.000Z",
  "createdAt": "2025-03-10T12:00:00.000Z"
}
```

#### 2. Execute Manually

```bash
curl -X POST http://localhost:3001/api/recurring-searches/cljk.../execute \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response**:

```json
{
  "message": "Search executed successfully",
  "resultCount": 3
}
```

#### 3. Get Results

```bash
curl http://localhost:3001/api/recurring-searches/cljk.../results \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response**:

```json
[
  {
    "id": "result1",
    "query": "NestJS updates",
    "results": [
      {
        "title": "Mock Result 1",
        "url": "https://example.com/result-1",
        "snippet": "This is a mock search result..."
      }
    ],
    "resultCount": 3,
    "executedAt": "2025-03-10T12:00:00.000Z"
  }
]
```

#### 4. Update Search

```bash
curl -X PUT http://localhost:3001/api/recurring-searches/cljk... \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "intervalValue": "6",
    "isActive": true
  }'
```

#### 5. Pause Search

```bash
curl -X PUT http://localhost:3001/api/recurring-searches/cljk... \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

#### 6. Delete Search

```bash
curl -X DELETE http://localhost:3001/api/recurring-searches/cljk... \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### BullMQ Dashboard (Optional)

Install Bull Board for visual job monitoring:

```bash
pnpm add @bull-board/api @bull-board/nestjs
```

Access dashboard at `http://localhost:3001/admin/queues`.

---

## Security & Permissions

### Authentication

All endpoints require valid JWT token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### User Scoping

- Users can only access their own recurring searches
- `userId` automatically extracted from JWT
- Database queries filtered by `userId`

### Permission Checks

```typescript
// In service methods
const search = await this.prisma.recurringSearch.findUnique({
  where: { id: searchId }
});

if (search.userId !== userId) {
  throw new ForbiddenException('Access denied');
}
```

### Rate Limiting (Recommended)

Add rate limiting to prevent abuse:

```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

ThrottlerModule.forRoot({
  ttl: 60,
  limit: 10, // 10 requests per minute
}),
```

---

## Examples

### Example 1: Daily News Digest

Create a search that runs every morning at 9 AM:

```bash
curl -X POST http://localhost:3001/api/recurring-searches \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "technology news today",
    "intervalType": "cron",
    "intervalValue": "0 9 * * *"
  }'
```

### Example 2: Hourly Market Updates

Monitor stock market every hour during trading hours:

```bash
curl -X POST http://localhost:3001/api/recurring-searches \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "NASDAQ real-time updates",
    "intervalType": "hours",
    "intervalValue": "1"
  }'
```

### Example 3: Weekly Competitor Analysis

Check competitor mentions once a week:

```bash
curl -X POST http://localhost:3001/api/recurring-searches \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CompanyX product launches",
    "intervalType": "cron",
    "intervalValue": "0 0 * * 1"
  }'
```

### Example 4: Real-Time Monitoring

Search every 15 minutes for urgent topics:

```bash
curl -X POST http://localhost:3001/api/recurring-searches \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "breaking cybersecurity news",
    "intervalType": "cron",
    "intervalValue": "*/15 * * * *"
  }'
```

---

## Troubleshooting

### Issue: Jobs Not Executing

**Cause**: Redis not running or misconfigured.

**Solution**:

```bash
# Check Redis connection
redis-cli ping
# Should return: PONG

# Check environment variables
echo $REDIS_HOST
echo $REDIS_PORT
```

### Issue: "Property 'recurringSearch' does not exist"

**Cause**: Prisma client not generated after schema update.

**Solution**:

```bash
cd apps/api
npx prisma generate
```

### Issue: Cron Expression Invalid

**Cause**: Malformed cron string.

**Solution**: Use a cron validator like [crontab.guru](https://crontab.guru).

### Issue: Search Results Empty

**Cause**: WebSearchAdapter still using stub implementation.

**Solution**: Implement production search API (see [Production Integration](#production-integration)).

---

## Future Enhancements

### Planned Features

1. **Email Notifications**: Send email when new results found
2. **WebSocket Alerts**: Real-time push notifications to frontend
3. **Result Deduplication**: Compare with previous results, only notify on new content
4. **Search Analytics**: Track trends, frequency, result counts over time
5. **Advanced Filtering**: Filter results by date, source, relevance
6. **Multi-Engine Search**: Aggregate results from multiple search providers
7. **Export Results**: Download results as CSV/JSON
8. **Shared Searches**: Allow users to share searches with team members

---

## Conclusion

The Recurring Search System provides a robust, scalable foundation for automated web search monitoring. With flexible scheduling, reliable job processing via BullMQ, and an extensible adapter pattern, it's ready for both development testing and production deployment.

For questions or issues, refer to:
- [BullMQ Documentation](https://docs.bullmq.io)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com)
