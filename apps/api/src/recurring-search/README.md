# Recurring Search Module

## Overview

Automated web search system with scheduled execution using BullMQ job queue.

## Structure

```
recurring-search/
├── adapters/
│   └── web-search.adapter.ts        # Search provider (stub/production)
├── dto/
│   └── create-recurring-search.dto.ts  # DTOs & validation
├── recurring-search.controller.ts   # REST endpoints (8 routes)
├── recurring-search.service.ts      # Business logic (~260 lines)
├── recurring-search.processor.ts    # BullMQ worker
├── recurring-search.module.ts       # Module configuration
└── README.md                        # This file
```

## Features

- ✅ **Flexible Scheduling**: Hourly intervals or cron expressions
- ✅ **BullMQ Integration**: Reliable background job processing
- ✅ **Search History**: All results persisted in database
- ✅ **Manual Execution**: Trigger searches on-demand
- ✅ **Active/Inactive**: Pause/resume without deletion
- ✅ **User-Scoped**: Each user manages their own searches

## Quick Start

### 1. Create Search

```bash
POST /api/recurring-searches
{
  "query": "NestJS updates",
  "intervalType": "hours",
  "intervalValue": "6"
}
```

### 2. Execute Manually

```bash
POST /api/recurring-searches/:id/execute
```

### 3. Get Results

```bash
GET /api/recurring-searches/:id/results
```

## Documentation

For complete documentation, see:
- **Full Guide**: `/apps/api/RECURRING_SEARCH_SYSTEM.md` (1100+ lines)
- **Quick Reference**: `/apps/api/RECURRING_SEARCH_SYSTEM_SUMMARY.md`

## Database Models

### RecurringSearch

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier |
| userId | String | Owner |
| query | String | Search query |
| intervalType | String | 'cron' or 'hours' |
| intervalValue | String | Cron expr or number |
| isActive | Boolean | Enabled/disabled |
| lastRunAt | DateTime? | Last execution |
| nextRunAt | DateTime? | Next scheduled |

### SearchResult

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier |
| recurringSearchId | String | Parent search |
| query | String | Query executed |
| results | Json | Array of results |
| resultCount | Int | Number of results |
| executedAt | DateTime | Execution time |

## Scheduling

### Hours

```json
{ "intervalType": "hours", "intervalValue": "6" }
```

### Cron

```json
{ "intervalType": "cron", "intervalValue": "0 9 * * *" }
```

**Common Patterns**:
- `0 9 * * *` - Daily at 9 AM
- `0 */6 * * *` - Every 6 hours
- `*/30 * * * *` - Every 30 minutes

## Production Setup

### 1. Redis (Required)

```bash
docker run -d -p 6379:6379 redis:alpine
```

### 2. Environment Variables

```env
REDIS_HOST=localhost
REDIS_PORT=6379
GOOGLE_SEARCH_API_KEY=your_key  # For production search
GOOGLE_SEARCH_CX=your_cx        # For production search
```

### 3. Database Migration

```bash
cd apps/api
npx prisma migrate dev --name add_recurring_search
npx prisma generate
```

## WebSearchAdapter

Currently uses stub implementation (3 mock results).

For production, integrate:
- **Google Custom Search API** (see docs)
- **Bing Search API** (see docs)
- **SerpAPI** (multi-engine)

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recurring-searches` | Create |
| GET | `/api/recurring-searches` | List all |
| GET | `/api/recurring-searches/:id` | Get one |
| PUT | `/api/recurring-searches/:id` | Update |
| DELETE | `/api/recurring-searches/:id` | Delete |
| GET | `/api/recurring-searches/:id/results` | Get results |
| GET | `/api/recurring-searches/results/:resultId` | Get single result |
| POST | `/api/recurring-searches/:id/execute` | Execute now |

## Status

✅ Code Complete  
✅ Prisma Generated  
✅ Module Loaded  
✅ Endpoints Mapped (8 routes)  
⏳ Database Migration (pending)  
⏳ Production Search API (pending)  

## Testing

See [RECURRING_SEARCH_SYSTEM.md](../../RECURRING_SEARCH_SYSTEM.md#testing-guide) for complete testing guide.
