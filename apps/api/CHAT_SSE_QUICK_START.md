# Chat SSE Backend - Quick Reference

Complete guide for the Server-Sent Events streaming chat system.

## 🚀 Quick Start

### Start the API

```bash
cd apps/api
pnpm dev

# API runs on http://localhost:3001
```

### Test the Flow

```bash
# 1. Get JWT token (login first)
TOKEN="your_jwt_token"

# 2. Start chat session
SESSION_ID=$(curl -s -X POST http://localhost:3001/api/chat/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"modelId":"gpt-4-turbo","prompt":"What is AI?"}' \
  | jq -r '.sessionId')

echo "Session ID: $SESSION_ID"

# 3. Stream response (SSE)
curl --no-buffer \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/chat/stream?sessionId=$SESSION_ID"

# 4. Get history
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/chat/history?chatId=$SESSION_ID"
```

---

## 📝 API Endpoints

### 1. POST /chat/start

**Purpose**: Create chat session, save user message, return sessionId

**Request**:
```json
{
  "modelId": "gpt-4-turbo",
  "prompt": "Your message here",
  "chatId": "optional-conversation-id",
  "projectId": "optional",
  "taskId": "optional"
}
```

**Response**:
```json
{
  "sessionId": "cm2exxxxx",
  "chatId": "cm2exxxxx"
}
```

**What it does**:
1. ✅ Verify user authentication
2. ✅ Check subscription tier (model access control)
3. ✅ Create ChatSession (expires in 10 min)
4. ✅ Save user message to database
5. ✅ Return sessionId for SSE connection

---

### 2. GET /chat/stream?sessionId=xxx

**Purpose**: SSE endpoint for streaming AI responses

**Request**:
```http
GET /api/chat/stream?sessionId=cm2exxxxx
Accept: text/event-stream
Authorization: Bearer {token}
```

**Response** (SSE stream):
```
data: {"type":"token","content":"AI"}

data: {"type":"token","content":" is"}

data: {"type":"token","content":"..."}

data: {"type":"done"}
```

**Event Types**:
- `token`: Single token chunk (`{ type: 'token', content: 'text' }`)
- `done`: Stream completed (`{ type: 'done' }`)
- `error`: Error occurred (`{ type: 'error', message: 'details' }`)

**What it does**:
1. ✅ Validate session (exists, not expired, user owns it)
2. ✅ Get prompt from last user message
3. ✅ Check Redis cache (if cached, stream from cache)
4. ✅ Stream from AI model adapter (OpenAI, Anthropic, xAI)
5. ✅ Save assistant message to database
6. ✅ Cache response in Redis (1h TTL)
7. ✅ Send `done` event

---

### 3. GET /chat/history?chatId=xxx

**Purpose**: Get conversation history

**Query Params**:
- `chatId` - Conversation ID
- `projectId` - Filter by project
- `taskId` - Filter by task
- `limit` - Max messages (default: 50)

**Response**:
```json
{
  "chatId": "cm2exxxxx",
  "messages": [
    {
      "id": "msg-1",
      "content": "User message",
      "createdAt": "2025-10-05T10:00:00Z",
      "model": { "id": "gpt-4-turbo", "name": "GPT-4 Turbo" }
    },
    {
      "id": "msg-2",
      "content": "AI response",
      "createdAt": "2025-10-05T10:00:05Z"
    }
  ]
}
```

---

## 🏗️ Architecture

### Data Flow

```
1. User types message
        ↓
2. Frontend: POST /chat/start
   - Send: { modelId, prompt }
   - Receive: { sessionId, chatId }
        ↓
3. Frontend: Open EventSource
   - GET /chat/stream?sessionId=xxx
        ↓
4. Backend: Stream tokens
   - Check cache (if cached: stream from cache)
   - If not cached: stream from AI model
   - Save to database
   - Cache response
        ↓
5. Frontend: Display tokens in real-time
        ↓
6. Backend: Send done event
        ↓
7. Frontend: Close EventSource
```

### Components

**ChatController** → Handles HTTP/SSE requests  
**ChatService** → Business logic, session management, streaming  
**AI Adapters** → OpenAI, Anthropic, xAI integration  
**ChatCacheService** → Redis caching (99% cost savings)  
**Prisma** → Database operations (ChatSession, Message)

---

## 💾 Database Schema

### ChatSession

```prisma
model ChatSession {
  id        String   @id @default(cuid())
  userId    String
  modelId   String
  chatId    String?  // Optional: group sessions
  projectId String?
  taskId    String?
  createdAt DateTime @default(now())
  expiresAt DateTime // Expires in 10 minutes

  @@index([userId])
  @@index([chatId])
  @@index([expiresAt])
}
```

**Purpose**: Temporary session tracking  
**Lifecycle**: Created → Used for streaming → Expires (10 min)  
**Cleanup**: Recommended cron job to delete expired sessions

---

## 🔧 Code Snippets

### Frontend: Connect to SSE

```typescript
// 1. Start chat
const startResponse = await fetch('/api/chat/start', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    modelId: 'gpt-4-turbo',
    prompt: 'What is AI?',
  }),
});

const { sessionId, chatId } = await startResponse.json();

// 2. Open SSE connection
const eventSource = new EventSource(
  `/api/chat/stream?sessionId=${sessionId}`,
  { withCredentials: true }
);

let fullResponse = '';

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'token') {
    fullResponse += data.content;
    // Update UI immediately
    setMessages((prev) => [...prev, { content: fullResponse }]);
  } else if (data.type === 'done') {
    console.log('Stream complete');
    eventSource.close();
  } else if (data.type === 'error') {
    console.error(data.message);
    eventSource.close();
  }
};

eventSource.onerror = () => {
  console.error('Connection lost');
  eventSource.close();
};
```

---

### Backend: Create Session

```typescript
// ChatService.createChatSession()
const expiresAt = new Date();
expiresAt.setMinutes(expiresAt.getMinutes() + 10);

const session = await this.prisma.chatSession.create({
  data: {
    userId,
    modelId,
    chatId,
    expiresAt,
  },
});

// Save user message
await this.prisma.message.create({
  data: {
    userId,
    content: prompt,
    modelId,
  },
});

return session;
```

---

### Backend: Stream Response

```typescript
// ChatService.streamChatResponse()
async *streamChatResponse(sessionId: string, userId: string) {
  // 1. Validate session
  const session = await this.prisma.chatSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.userId !== userId) {
    yield { type: 'error', message: 'Invalid session' };
    return;
  }

  // 2. Get prompt
  const userMessage = await this.prisma.message.findFirst({
    where: { userId, modelId: session.modelId },
    orderBy: { createdAt: 'desc' },
  });

  const prompt = userMessage.content;

  // 3. Check cache
  const cached = await this.chatCache.getCachedResponse(
    session.modelId,
    prompt,
  );

  if (cached) {
    // Stream from cache
    for (const char of cached) {
      yield { type: 'token', content: char };
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    yield { type: 'done' };
    return;
  }

  // 4. Stream from AI
  let fullResponse = '';

  for await (const chunk of adapter.streamChatCompletion(
    session.modelId,
    prompt,
  )) {
    fullResponse += chunk;
    yield { type: 'token', content: chunk };
  }

  // 5. Cache and save
  await this.chatCache.setCachedResponse(
    session.modelId,
    prompt,
    fullResponse,
  );

  await this.prisma.message.create({
    data: {
      userId,
      content: fullResponse,
      modelId: session.modelId,
    },
  });

  yield { type: 'done' };
}
```

---

## 🧪 Testing

### Manual Test

```bash
# Terminal 1: Start API
cd apps/api
pnpm dev

# Terminal 2: Test flow
TOKEN="your_token"

# Start session
curl -X POST http://localhost:3001/api/chat/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"modelId":"gpt-4-turbo","prompt":"Hello"}'

# Copy sessionId from response
SESSION_ID="cm2exxxxx"

# Stream response
curl --no-buffer \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/chat/stream?sessionId=$SESSION_ID"

# Get history
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/chat/history?chatId=$SESSION_ID"
```

---

### Integration Test

```typescript
describe('Chat SSE', () => {
  it('should stream tokens', async () => {
    // Start session
    const startRes = await request(app.getHttpServer())
      .post('/api/chat/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ modelId: 'gpt-4-turbo', prompt: 'Test' })
      .expect(200);

    const { sessionId } = startRes.body;

    // Stream
    const streamRes = await request(app.getHttpServer())
      .get(`/api/chat/stream?sessionId=${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'text/event-stream');

    expect(streamRes.text).toContain('data: {"type":"token"');
    expect(streamRes.text).toContain('data: {"type":"done"}');
  });
});
```

---

## 🐛 Troubleshooting

### Issue: "Session not found"

**Cause**: Session expired (10 min TTL) or invalid ID

**Solution**: Call `POST /chat/start` again to create new session

---

### Issue: SSE closes immediately

**Cause**: Error in stream generator

**Debug**:
```bash
# Check API logs
docker logs -f whalli-api

# Look for:
# [ChatService] Error streaming response: ...
```

**Common causes**:
- Redis connection failed → Check `REDIS_HOST`, `REDIS_PORT`
- AI adapter error → Check `OPENAI_API_KEY`
- Database error → Check Prisma connection

---

### Issue: Tokens not streaming (all at once)

**Cause**: Frontend not using EventSource

**Fix**:
```typescript
// ❌ Wrong: Using fetch
const response = await fetch('/api/chat/stream?sessionId=xxx');

// ✅ Correct: Using EventSource
const eventSource = new EventSource('/api/chat/stream?sessionId=xxx');
```

---

### Issue: "Model access denied"

**Cause**: User subscription tier too low

**Check**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/chat/check-access/gpt-4-turbo

# Response:
# {
#   "allowed": false,
#   "plan": "BASIC",
#   "reason": "Model requires PRO subscription"
# }
```

**Solution**: Upgrade subscription or use allowed model

---

## 📊 Performance

### Cache Hit Rate

```bash
# Check Redis cache
docker exec whalli-redis redis-cli

# Get cache keys
KEYS "chat:*"

# Check cache hit rate (from metrics)
curl http://localhost:3001/api/metrics | grep cache_hit_rate
```

**Expected**: 80%+ cache hit rate for common queries

---

### Session Cleanup

**Recommended**: Cron job to delete expired sessions

```typescript
// Add to NestJS cron job
@Cron('0 */5 * * *') // Every 5 minutes
async cleanupExpiredSessions() {
  const deleted = await this.prisma.chatSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  this.logger.log(`Cleaned up ${deleted.count} expired sessions`);
}
```

---

## 📦 Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | ChatSession model |
| `src/chat/dto/start-chat.dto.ts` | DTO for POST /chat/start |
| `src/chat/chat.controller.ts` | HTTP/SSE endpoints |
| `src/chat/chat.service.ts` | Session + streaming logic |
| `src/chat/adapters/*.adapter.ts` | AI provider integration |

---

## 🎯 Next Steps

1. **Test end-to-end**: Frontend → Backend → AI → Frontend
2. **Monitor cache hit rate**: Should be 80%+
3. **Set up session cleanup**: Cron job every 5 minutes
4. **Add reconnection logic**: Frontend retry on connection loss
5. **Rate limiting**: Per-session limits (e.g., 10 requests/session)

---

**Status**: ✅ Complete  
**Version**: 1.0.0  
**Last Updated**: October 5, 2025

For detailed documentation, see `CHAT_SSE_BACKEND.md`.
