# Chat SSE Integration - Quick Reference

## 🚀 Quick Start

### Frontend (Next.js)

```bash
# 1. Set API URL in .env
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" >> apps/web/.env

# 2. Start dev server
cd apps/web
pnpm dev

# 3. Navigate to http://localhost:3000/chat
```

### Backend (NestJS) - TODO

```bash
# Implement these endpoints:
# - GET  /api/chat/history?chatId={chatId}
# - POST /api/chat/start
# - GET  /api/chat/stream?sessionId={sessionId} (SSE)
```

---

## 📝 API Endpoints Required

### 1. **GET /api/chat/history**

Load conversation history for existing chats.

**Request**:
```http
GET /api/chat/history?chatId=chat123
```

**Response**:
```json
{
  "chatId": "chat123",
  "messages": [
    {
      "id": "msg1",
      "role": "user",
      "content": "Hello!",
      "createdAt": "2025-10-05T10:00:00Z"
    },
    {
      "id": "msg2",
      "role": "assistant",
      "content": "Hi! How can I help?",
      "createdAt": "2025-10-05T10:00:05Z"
    }
  ]
}
```

---

### 2. **POST /api/chat/start**

Start a new chat session.

**Request**:
```json
{
  "prompt": "What is AI?",
  "modelId": "gpt-4-turbo",
  "userId": "user123",
  "chatId": "chat456",    // optional
  "projectId": null,      // optional
  "taskId": null          // optional
}
```

**Response**:
```json
{
  "sessionId": "session-abc123",
  "chatId": "chat456"
}
```

---

### 3. **GET /api/chat/stream (SSE)**

Stream AI response tokens in real-time.

**Request**:
```http
GET /api/chat/stream?sessionId=session-abc123
Accept: text/event-stream
```

**Response** (Server-Sent Events):
```
data: {"type":"token","content":"AI"}

data: {"type":"token","content":" stands"}

data: {"type":"token","content":" for"}

data: {"type":"token","content":" Artificial"}

data: {"type":"token","content":" Intelligence"}

data: {"type":"done"}
```

**Event Types**:
- `token`: Single token chunk (`{ type: 'token', content: 'text' }`)
- `done`: Stream completed (`{ type: 'done' }`)
- `error`: Error occurred (`{ type: 'error', message: 'Details' }`)

---

## 🔧 Usage in Components

### Basic Chat

```tsx
import { ChatUI } from '@/components/chat/ChatUI';

export default function ChatPage() {
  return (
    <ChatUI
      userId="user123"
      apiUrl={process.env.NEXT_PUBLIC_API_URL}
    />
  );
}
```

### Existing Chat with History

```tsx
import { ChatUI } from '@/components/chat/ChatUI';

export default function ChatPage({ params }: { params: { chatId: string } }) {
  return (
    <ChatUI
      userId="user123"
      chatId={params.chatId}  // Loads history automatically
    />
  );
}
```

---

## 🧪 Testing Checklist

### Manual Tests

- [ ] **New Chat**: Send message, see streaming response
- [ ] **Load History**: Navigate to `/chat/chat123`, see previous messages
- [ ] **Stop Streaming**: Click "Stop Generating" during response
- [ ] **Error Handling**: Stop backend, see error banner
- [ ] **Model Switching**: Change model mid-conversation
- [ ] **Model Pinning**: Pin model, verify all messages use it

### Expected Behaviors

| Action | Expected Result |
|--------|----------------|
| Send message | User message appears immediately |
| AI response | Streams character-by-character |
| Complete stream | Message marked as complete, can send next |
| Stop generation | Streaming stops, partial response saved |
| Backend offline | Error banner shows "Failed to connect" |
| Load history | Shows spinner → displays messages |

---

## 📊 Data Flow

```
User types message
    ↓
handleSendMessage() called
    ↓
useChat.sendMessage() executed
    ↓
1. Add user message to UI (instant)
    ↓
2. POST /api/chat/start
    ↓
3. Receive sessionId
    ↓
4. Create empty assistant message
    ↓
5. Open EventSource /api/chat/stream?sessionId=xxx
    ↓
6. Receive tokens (type: 'token')
    ↓
7. Append each token to message content
    ↓
8. UI updates in real-time (React state)
    ↓
9. Receive done event (type: 'done')
    ↓
10. Mark message complete, close connection
```

---

## 🐛 Troubleshooting

### Issue 1: "No model selected"

**Cause**: Models not loaded from API  
**Solution**: Check `NEXT_PUBLIC_API_URL` in `.env`

```bash
# Check env var
echo $NEXT_PUBLIC_API_URL

# Should output: http://localhost:3001
```

---

### Issue 2: "Failed to fetch history"

**Cause**: Backend endpoint not implemented  
**Solution**: Implement `/api/chat/history` in NestJS

```typescript
// apps/api/src/chat/chat.controller.ts
@Get('history')
async getHistory(@Query('chatId') chatId: string) {
  const messages = await this.chatService.getHistory(chatId);
  return { chatId, messages };
}
```

---

### Issue 3: Streaming not working

**Cause**: EventSource connection failed  
**Debug**:

```typescript
// In browser console:
const es = new EventSource('http://localhost:3001/api/chat/stream?sessionId=test');
es.onmessage = (e) => console.log('Received:', e.data);
es.onerror = (e) => console.error('Error:', e);
```

---

### Issue 4: CORS errors

**Cause**: Backend not allowing frontend origin  
**Solution**: Add CORS config in NestJS

```typescript
// apps/api/src/main.ts
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

---

## 📚 Code Reference

### useChat Hook

```typescript
import { useChat } from '@/hooks/useChat';

const {
  messages,        // Array of messages
  sendMessage,     // (content: string) => Promise<void>
  stopStreaming,   // () => void
  clearMessages,   // () => void
  isStreaming,     // boolean
  isLoading,       // boolean (for history)
  error,           // string | null
  currentSession   // { sessionId, chatId } | null
} = useChat({
  userId: 'user123',
  chatId: 'chat456',    // optional
  modelId: 'gpt-4-turbo',
  apiUrl: 'http://localhost:3001'
});
```

### Message Interface

```typescript
interface Message {
  id: string;               // Unique ID
  role: 'user' | 'assistant';
  content: string;          // Message text
  timestamp: Date;          // When sent
  isStreaming?: boolean;    // True during streaming
}
```

---

## ⚡ Performance Tips

1. **Debounce history fetching**: Avoid fetching on every render
2. **Memoize messages**: Use `useMemo` for large message lists
3. **Virtual scrolling**: For chats with 100+ messages
4. **Connection pooling**: Reuse EventSource connections when possible
5. **Batch updates**: Group token updates (e.g., every 10 tokens)

---

## 🔒 Security Considerations

1. **Authentication**: Always send user credentials with requests
2. **Rate Limiting**: Prevent abuse of chat endpoints
3. **Input Validation**: Sanitize user messages on backend
4. **Session Expiry**: Implement timeout for inactive sessions
5. **CSRF Protection**: Use tokens for POST requests

---

## 📦 Files Modified

| File | Changes |
|------|---------|
| `apps/web/src/hooks/useChat.ts` | Complete SSE implementation (350+ lines) |
| `apps/web/src/components/chat/ChatUI.tsx` | Integrated SSE hook, added error states |
| `apps/web/src/hooks/useChatModels.ts` | Fetches from real API |
| `apps/web/.env` | Added `NEXT_PUBLIC_API_URL` |

---

## 🎯 Next Steps

### Immediate (Frontend)
- ✅ SSE integration complete
- ✅ Error handling implemented
- ✅ Loading states added

### High Priority (Backend)
- ⏳ Implement `/api/chat/history` endpoint
- ⏳ Implement `/api/chat/start` endpoint
- ⏳ Implement `/api/chat/stream` SSE endpoint

### Medium Priority
- ⏳ Add typing indicators
- ⏳ Add message persistence to database
- ⏳ Add reconnection logic for dropped connections
- ⏳ Add message caching

### Low Priority
- ⏳ Add read receipts
- ⏳ Add message reactions
- ⏳ Add chat export functionality

---

## 📖 Full Documentation

See `CHAT_SSE_INTEGRATION.md` for complete documentation (800+ lines).

---

**Status**: ✅ Frontend Complete | ⏳ Backend Needed  
**Version**: 1.0.0  
**Last Updated**: October 5, 2025
