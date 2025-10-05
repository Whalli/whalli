# ChatService Implementation - Quick Reference

## ✅ What's Implemented

### Core Components

1. **ChatController** (`src/chat/chat.controller.ts`)
   - `GET /chat/models` - Get available models based on subscription
   - `POST /chat/messages/stream` - Send message, stream AI response via SSE
   - `GET /chat/history` - Get conversation history
   - `GET /chat/messages/:id` - Get single message
   - `GET /chat/check-access/:modelId` - Check model access permissions

2. **ChatService** (`src/chat/chat.service.ts`)
   - Subscription-based model access control
   - SSE streaming with async generators
   - Message persistence to PostgreSQL
   - Integration with billing subscription system

3. **Model Adapters** (`src/chat/adapters/`)
   - `OpenAIAdapter` - Stub for OpenAI GPT models
   - `AnthropicAdapter` - Stub for Anthropic Claude models
   - Ready for real API integration

4. **DTOs** (`src/chat/dto/`)
   - `SendMessageDto` - Request validation with class-validator

## 🔑 Key Features

### Subscription-Based Access Control

```typescript
MODEL_ACCESS_MATRIX = {
  BASIC: ['gpt-3.5-turbo', 'claude-3-haiku'],
  PRO: ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet', ...],
  ENTERPRISE: [ /* all models */ ],
}
```

- Automatically checks user subscription before allowing model access
- Returns appropriate error message if access denied
- Uses `subscriptionId` from User model (from previous implementation)

### Server-Sent Events (SSE) Streaming

```typescript
async *streamChatResponse(data) {
  yield { type: 'message_saved', data: { messageId } };
  
  for await (const chunk of adapter.streamChatCompletion(...)) {
    yield { type: 'chunk', data: { content: chunk } };
  }
  
  yield { type: 'complete', data: { messageId, fullResponse } };
}
```

- Real-time streaming to frontend
- Character-by-character text reveal
- Event-based architecture (chunk, complete, error)

### Message Persistence

```typescript
// Saves both user and AI messages
await prisma.message.create({
  userId, content, modelId, projectId, taskId
});
```

- All conversations stored in PostgreSQL
- Links to projects and tasks
- Tracks which model generated each response
- Full audit trail

## 🚀 Quick Start

### 1. Database Setup

```bash
cd apps/api

# Run migrations (if not done already)
npx prisma migrate dev

# Seed AI models
npx prisma db seed
```

### 2. Configure Environment

Add to `.env`:

```env
# Required for real implementation
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Test with cURL

```bash
# Get available models (requires auth token)
curl http://localhost:3001/chat/models \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send message with streaming
curl -N http://localhost:3001/chat/messages/stream \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"modelId":"gpt-3.5-turbo","prompt":"Hello!"}'
```

## 📊 Data Flow

```
1. Client sends POST /chat/messages/stream
   { userId, modelId, prompt }
   
2. ChatService.streamChatResponse()
   ↓
   a. Check subscription: checkModelAccess()
   ↓
   b. Verify model exists in database
   ↓
   c. Save user message → Prisma
   ↓
   d. Stream AI response → OpenAIAdapter/AnthropicAdapter
   ↓
   e. Save AI response → Prisma
   
3. Client receives SSE events:
   - message_saved
   - chunk, chunk, chunk...
   - complete
```

## 🔐 Security

- All endpoints protected by `@UseGuards(AuthGuard)`
- User can only access messages they created
- Subscription validation before expensive AI calls
- Model access matrix enforced server-side

## 📦 Dependencies

Already installed:
- `@nestjs/common`
- `@nestjs/config`
- `@prisma/client`
- `class-validator`
- `class-transformer`
- `rxjs`

Optional (for real AI integration):
```bash
pnpm add openai @anthropic-ai/sdk
```

## 🧪 Testing

### Test Flow

1. **Create test user with BASIC subscription**
   ```typescript
   const user = await prisma.user.create({
     data: {
       email: 'test@example.com',
       subscription: {
         create: {
           plan: 'BASIC',
           status: 'active'
         }
       }
     }
   });
   ```

2. **Get available models**
   - Should return gpt-3.5-turbo and claude-3-haiku only

3. **Try to access GPT-4**
   - Should return `allowed: false`

4. **Send message with allowed model**
   - Should stream response
   - Should save messages to database

5. **Upgrade user to PRO**
   ```typescript
   await prisma.subscription.update({
     where: { userId: user.id },
     data: { plan: 'PRO' }
   });
   ```

6. **Get available models again**
   - Should now include GPT-4, Claude Sonnet

## 🔌 Frontend Integration

### React Hook Example

```typescript
export function useStreamingChat() {
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (modelId: string, prompt: string) => {
    setIsStreaming(true);
    setResponse('');

    const res = await fetch('/chat/messages/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ modelId, prompt }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const event = JSON.parse(line.substring(6));
          
          if (event.type === 'chunk') {
            setResponse((prev) => prev + event.data.content);
          } else if (event.type === 'complete') {
            setIsStreaming(false);
          }
        }
      }
    }
  };

  return { response, isStreaming, sendMessage };
}
```

## 📝 TODO: Real AI Integration

### OpenAI

```typescript
// Install: pnpm add openai
import OpenAI from 'openai';

async *streamChatCompletion(modelId: string, prompt: string) {
  const openai = new OpenAI({ apiKey: this.apiKey });
  
  const stream = await openai.chat.completions.create({
    model: modelId,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) yield content;
  }
}
```

### Anthropic

```typescript
// Install: pnpm add @anthropic-ai/sdk
import Anthropic from '@anthropic-ai/sdk';

async *streamChatCompletion(modelId: string, prompt: string) {
  const anthropic = new Anthropic({ apiKey: this.apiKey });
  
  const stream = await anthropic.messages.create({
    model: modelId,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      yield event.delta.text;
    }
  }
}
```

## 🎯 What You Get

✅ **Subscription-aware chat service**
- Different models per plan tier
- Automatic access control
- Upgrade prompts when needed

✅ **Real-time streaming**
- Server-Sent Events (SSE)
- Character-by-character reveal
- Smooth user experience

✅ **Full persistence**
- All messages saved to PostgreSQL
- Track model used
- Associate with projects/tasks

✅ **Clean architecture**
- Pluggable adapters
- Easy to add new AI providers
- Testable components

✅ **Production-ready**
- Error handling
- Logging
- Validation
- Type safety

## 📚 Documentation

- **Full Guide**: `CHAT_SERVICE.md` (10+ pages)
- **This Quick Ref**: `CHAT_SERVICE_README.md`
- **Frontend Integration**: See Chat UI docs in `apps/web/`

---

**Status**: ✅ Ready for testing with stub implementation
**Next Step**: Add real AI API keys and integrate OpenAI/Anthropic SDKs
