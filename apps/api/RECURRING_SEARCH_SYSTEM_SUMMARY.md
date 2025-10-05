# Recurring Search System - Quick Reference

## 🎯 Overview

Automated web search system with scheduled execution via BullMQ. Users create searches that run at specified intervals (hourly or cron), with results stored in database for historical tracking.

---

## 📊 Key Features

✅ **Flexible Scheduling**: Hours (1, 6, 24) or Cron expressions (`0 9 * * *`)  
✅ **BullMQ Queue**: Reliable background jobs with Redis  
✅ **Search History**: All results persisted with timestamps  
✅ **Manual Trigger**: Execute searches on-demand  
✅ **Active/Inactive**: Pause/resume without deletion  
✅ **Adapter Pattern**: Swap search providers easily  

---

## 🗄️ Database Models

### RecurringSearch

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier |
| userId | String | Owner of search |
| query | String | Search query text |
| intervalType | String | 'cron' or 'hours' |
| intervalValue | String | Cron expression or number |
| isActive | Boolean | Enable/disable |
| lastRunAt | DateTime? | Last execution time |
| nextRunAt | DateTime? | Next scheduled time |

### SearchResult

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier |
| recurringSearchId | String | Parent search |
| query | String | Query executed |
| results | Json | Array of results |
| resultCount | Int | Number of results |
| executedAt | DateTime | Execution timestamp |

---

## 🔌 API Endpoints

### Base URL: `/api/recurring-searches`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create new search |
| GET | `/` | List all user searches |
| GET | `/:id` | Get single search |
| PUT | `/:id` | Update search |
| DELETE | `/:id` | Delete search |
| GET | `/:id/results` | Get search results |
| GET | `/results/:resultId` | Get single result |
| POST | `/:id/execute` | Execute immediately |

---

## 🚀 Quick Start

### 1. Create Hourly Search

```bash
curl -X POST http://localhost:3001/api/recurring-searches \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "NestJS updates",
    "intervalType": "hours",
    "intervalValue": "6"
  }'
```

### 2. Create Daily Cron Search

```bash
curl -X POST http://localhost:3001/api/recurring-searches \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "tech news",
    "intervalType": "cron",
    "intervalValue": "0 9 * * *"
  }'
```

### 3. Execute Manually

```bash
curl -X POST http://localhost:3001/api/recurring-searches/{id}/execute \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Get Results

```bash
curl http://localhost:3001/api/recurring-searches/{id}/results \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⏰ Scheduling Examples

### Hours Interval

| Value | Description |
|-------|-------------|
| `"1"` | Every hour |
| `"6"` | Every 6 hours |
| `"12"` | Twice daily |
| `"24"` | Once daily |

### Cron Expressions

| Expression | Description |
|------------|-------------|
| `0 9 * * *` | Daily at 9 AM |
| `0 */6 * * *` | Every 6 hours |
| `0 0 * * 0` | Weekly (Sundays) |
| `*/30 * * * *` | Every 30 minutes |
| `0 0 1 * *` | Monthly (1st day) |

---

## 🔄 Data Flow

```
1. User creates RecurringSearch
       ↓
2. Service schedules BullMQ job
       ↓
3. Job triggers at interval
       ↓
4. Processor calls WebSearchAdapter
       ↓
5. Results saved to SearchResult table
       ↓
6. RecurringSearch updated (lastRunAt, nextRunAt)
```

---

## 🛠️ Setup Requirements

### 1. Redis (Required for BullMQ)

```bash
docker run -d -p 6379:6379 redis:alpine
```

### 2. Environment Variables

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Database Migration

```bash
cd apps/api
npx prisma migrate dev --name add_recurring_search
npx prisma generate
```

---

## 🧪 WebSearchAdapter

### Stub (Development)

Currently returns 3 mock results with 1s delay.

**Location**: `apps/api/src/recurring-search/adapters/web-search.adapter.ts`

### Production Integration

#### Google Custom Search API

```typescript
const response = await axios.get(
  'https://www.googleapis.com/customsearch/v1',
  {
    params: {
      key: process.env.GOOGLE_SEARCH_API_KEY,
      cx: process.env.GOOGLE_SEARCH_CX,
      q: query,
      num: 10,
    },
  }
);
```

**Environment Variables**:

```env
GOOGLE_SEARCH_API_KEY=your_key
GOOGLE_SEARCH_CX=your_cx
```

#### Bing Search API

```typescript
const response = await axios.get(
  'https://api.bing.microsoft.com/v7.0/search',
  {
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.BING_SEARCH_API_KEY,
    },
    params: { q: query, count: 10 },
  }
);
```

---

## 🔐 Security

- **Authentication**: All endpoints require JWT
- **User Scoping**: Users only access their own searches
- **Permission Checks**: `userId` validated on every operation
- **Cascade Deletion**: Deleting search removes all results

---

## 📦 Module Structure

```
recurring-search/
├── dto/
│   └── create-recurring-search.dto.ts   # DTOs & validation
├── adapters/
│   └── web-search.adapter.ts            # Search provider
├── recurring-search.service.ts          # Business logic
├── recurring-search.processor.ts        # BullMQ worker
├── recurring-search.controller.ts       # REST endpoints
└── recurring-search.module.ts           # Module config
```

---

## 🐛 Troubleshooting

### Jobs Not Executing

**Check Redis**:

```bash
redis-cli ping
# Should return: PONG
```

### TypeScript Errors

**Regenerate Prisma Client**:

```bash
cd apps/api
npx prisma generate
```

### Empty Results

**Switch to production search API** (see WebSearchAdapter section above).

---

## 📈 Monitoring (Optional)

Install Bull Board for visual job monitoring:

```bash
pnpm add @bull-board/api @bull-board/nestjs
```

Access at: `http://localhost:3001/admin/queues`

---

## 🎨 Example Use Cases

### 1. Daily News Digest

```json
{
  "query": "technology news today",
  "intervalType": "cron",
  "intervalValue": "0 9 * * *"
}
```

### 2. Hourly Market Updates

```json
{
  "query": "stock market updates",
  "intervalType": "hours",
  "intervalValue": "1"
}
```

### 3. Weekly Competitor Analysis

```json
{
  "query": "CompanyX announcements",
  "intervalType": "cron",
  "intervalValue": "0 0 * * 1"
}
```

### 4. Real-Time Monitoring

```json
{
  "query": "breaking cybersecurity news",
  "intervalType": "cron",
  "intervalValue": "*/15 * * * *"
}
```

---

## 📚 Full Documentation

For complete details, see [RECURRING_SEARCH_SYSTEM.md](./RECURRING_SEARCH_SYSTEM.md).

---

## 🚦 Status

✅ **Code Complete**: All files created  
✅ **Prisma Generated**: Client ready  
✅ **Module Loaded**: RecurringSearchModule active  
✅ **Endpoints Mapped**: 8 routes registered  
⏳ **Database Migration**: Pending (run when DB available)  
⏳ **Production Search**: Pending (integrate Google/Bing API)  

---

## 🔗 Related Documentation

- [BullMQ Docs](https://docs.bullmq.io)
- [Prisma Docs](https://www.prisma.io/docs)
- [Cron Expression Guide](https://crontab.guru)
- [Google Custom Search](https://developers.google.com/custom-search)
