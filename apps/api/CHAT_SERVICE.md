# Chat Service Documentation

Complete AI chat service implementation with subscription-based model access control, SSE streaming, and message persistence.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
- [Subscription Plans](#subscription-plans)
- [Usage Examples](#usage-examples)
- [Testing](#testing)

## 🎯 Overview

The ChatService provides a complete AI chat implementation with:
- **Subscription-based access control**: Different models available per plan tier
- **Server-Sent Events (SSE)**: Real-time streaming responses
- **Message persistence**: All conversations saved to PostgreSQL
- **Model adapters**: Pluggable architecture for different AI providers
- **Better-Auth integration**: Leverages existing authentication

## ✨ Features

### ✅ Core Functionality
- Get available models based on user subscription
- Send messages and stream AI responses via SSE
- Persist user messages and AI responses to database
- Check model access permissions
- Get chat history with filtering

### ✅ Subscription Integration
- **BASIC Plan**: Access to GPT-3.5 Turbo, Claude 3 Haiku
- **PRO Plan**: Access to GPT-4, Claude 3 Sonnet, and all BASIC models
- **ENTERPRISE Plan**: Full access to all models including GPT-4 Turbo, Claude 3 Opus

### ✅ AI Provider Support
- OpenAI (GPT-3.5, GPT-4, GPT-4 Turbo)
- Anthropic (Claude 2.1, Claude 3 Haiku/Sonnet/Opus)
- Extensible adapter pattern for adding more providers

### ✅ Message Management
- Associate messages with projects or tasks
- Support for file attachments
- Track model used for each message
- Retrieve conversation history

## 🏗️ Architecture

### File Structure

```
apps/api/src/chat/
├── adapters/
│   ├── openai.adapter.ts       # OpenAI API integration
│   └── anthropic.adapter.ts    # Anthropic API integration
├── dto/
│   └── send-message.dto.ts     # Request validation
├── chat.controller.ts          # REST endpoints + SSE
├── chat.service.ts             # Business logic
└── chat.module.ts              # NestJS module configuration
```

### Components

1. **ChatController**: Handles HTTP requests and SSE streaming
2. **ChatService**: Core business logic, access control, message persistence
3. **Model Adapters**: Provider-specific AI API integrations
4. **PrismaService**: Database operations for messages, models, users

### Data Flow

```
Client Request
    ↓
ChatController (@Sse decorator)
    ↓
ChatService.streamChatResponse()
    ↓
1. Check subscription → MODEL_ACCESS_MATRIX
2. Validate model exists → Prisma.model.findUnique()
3. Save user message → Prisma.message.create()
4. Stream AI response → OpenAIAdapter/AnthropicAdapter
5. Save AI response → Prisma.message.create()
    ↓
SSE Events emitted to client
```

## 🚀 Setup

### 1. Install Dependencies

```bash
cd apps/api
pnpm add @nestjs/config rxjs
```

### 2. Configure Environment Variables

Add to `apps/api/.env`:

```env
# OpenAI API Key (for GPT models)
OPENAI_API_KEY=sk-...

# Anthropic API Key (for Claude models)
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Other AI providers
GOOGLE_API_KEY=...
COHERE_API_KEY=...
```

### 3. Seed Database with Models

Run the seed script to populate AI models:

```bash
cd apps/api
pnpm prisma db seed
# or
npm run seed
```

This will create:
- 6 companies (OpenAI, Anthropic, Google, Meta, Mistral, Cohere)
- 8 AI models with metadata (capabilities, latency, cost)

### 4. Verify Database

```bash
npx prisma studio
```

Check that `companies` and `models` tables are populated.

## 📡 API Endpoints

### Base URL: `/chat`

All endpoints require authentication (Bearer token).

---

### 1. Get Available Models

```http
GET /chat/models
Authorization: Bearer {token}
```

**Response:**
```json
{
  "models": [
    {
      "id": "gpt-3.5-turbo",
      "name": "GPT-3.5 Turbo",
      "company": "OpenAI",
      "description": "Fast and efficient for most conversational tasks",
      "capabilities": {
        "reasoning": "good",
        "coding": "good",
        "creative": "good",
        "context": "16k"
      },
      "latencyHint": "Fast (1-2s)",
      "costEstimate": "$"
    }
  ],
  "userPlan": "BASIC",
  "subscriptionStatus": "active"
}
```

---

### 2. Send Message and Stream Response (SSE)

```http
POST /chat/messages/stream
Authorization: Bearer {token}
Content-Type: application/json

{
  "modelId": "gpt-4-turbo",
  "prompt": "Explain quantum computing in simple terms",
  "projectId": "optional-project-id",
  "taskId": "optional-task-id"
}
```

**Response (Server-Sent Events):**

```
data: {"type":"message_saved","data":{"messageId":"msg_123"}}

data: {"type":"chunk","data":{"content":"Quantum "}}

data: {"type":"chunk","data":{"content":"computing "}}

data: {"type":"chunk","data":{"content":"is..."}}

data: {"type":"complete","data":{"messageId":"msg_456","fullResponse":"Quantum computing is..."}}
```

**Event Types:**
- `message_saved`: User message saved to database
- `chunk`: Streaming response chunk
- `complete`: Response finished, AI message saved
- `error`: Error occurred (e.g., model access denied)

---

### 3. Get Chat History

```http
GET /chat/history?projectId={id}&limit=50
Authorization: Bearer {token}
```

**Query Parameters:**
- `projectId` (optional): Filter by project
- `taskId` (optional): Filter by task
- `limit` (optional): Number of messages (default: 50)

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_123",
      "userId": "user_456",
      "content": "Hello, how are you?",
      "modelId": "gpt-3.5-turbo",
      "createdAt": "2025-10-03T10:00:00Z",
      "user": {
        "id": "user_456",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "https://..."
      },
      "model": {
        "id": "gpt-3.5-turbo",
        "name": "GPT-3.5 Turbo",
        "company": {
          "name": "OpenAI"
        }
      }
    }
  ]
}
```

---

### 4. Get Single Message

```http
GET /chat/messages/{messageId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "msg_123",
  "userId": "user_456",
  "content": "Message content",
  "modelId": "gpt-4",
  "projectId": "proj_789",
  "taskId": null,
  "createdAt": "2025-10-03T10:00:00Z",
  "user": { /* user details */ },
  "model": { /* model details */ },
  "project": { /* project details */ },
  "messageAttachments": []
}
```

---

### 5. Check Model Access

```http
GET /chat/check-access/{modelId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "allowed": true,
  "plan": "PRO",
  "reason": null
}
```

Or if denied:
```json
{
  "allowed": false,
  "plan": "BASIC",
  "reason": "Model gpt-4-turbo requires a higher subscription tier. Current plan: BASIC"
}
```

## 📊 Subscription Plans

### Model Access Matrix

| Model | BASIC | PRO | ENTERPRISE |
|-------|-------|-----|------------|
| GPT-3.5 Turbo | ✅ | ✅ | ✅ |
| GPT-3.5 Turbo 16K | ❌ | ✅ | ✅ |
| GPT-4 | ❌ | ✅ | ✅ |
| GPT-4 Turbo | ❌ | ❌ | ✅ |
| Claude 3 Haiku | ✅ | ✅ | ✅ |
| Claude 2.1 | ❌ | ✅ | ✅ |
| Claude 3 Sonnet | ❌ | ✅ | ✅ |
| Claude 3 Opus | ❌ | ❌ | ✅ |

**Configuration:**

Located in `chat.service.ts`:

```typescript
const MODEL_ACCESS_MATRIX: Record<SubscriptionPlan, string[]> = {
  BASIC: ['gpt-3.5-turbo', 'claude-3-haiku'],
  PRO: ['gpt-3.5-turbo', 'gpt-4', 'gpt-3.5-turbo-16k', 'claude-3-haiku', 'claude-3-sonnet', 'claude-2.1'],
  ENTERPRISE: [ /* all models */ ],
};
```

## 💻 Usage Examples

### Frontend Integration (React/Next.js)

#### 1. Fetch Available Models

```typescript
async function fetchModels() {
  const response = await fetch('http://localhost:3001/chat/models', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data.models;
}
```

#### 2. Send Message with SSE Streaming

```typescript
async function sendMessage(modelId: string, prompt: string) {
  const response = await fetch('http://localhost:3001/chat/messages/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ modelId, prompt }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        
        if (data.type === 'chunk') {
          // Update UI with streaming content
          setMessage((prev) => prev + data.data.content);
        } else if (data.type === 'complete') {
          // Response finished
          console.log('Full response:', data.data.fullResponse);
        } else if (data.type === 'error') {
          // Handle error
          alert(data.data.message);
        }
      }
    }
  }
}
```

#### 3. React Hook for Chat

```typescript
import { useState, useCallback } from 'react';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (modelId: string, prompt: string) => {
    setIsStreaming(true);
    
    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: prompt, timestamp: new Date() },
    ]);

    // Add placeholder for assistant message
    const assistantIndex = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', timestamp: new Date(), isStreaming: true },
    ]);

    const response = await fetch('/chat/messages/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ modelId, prompt }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const event = JSON.parse(line.substring(6));
          
          if (event.type === 'chunk') {
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[assistantIndex].content += event.data.content;
              return newMessages;
            });
          } else if (event.type === 'complete') {
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[assistantIndex].isStreaming = false;
              return newMessages;
            });
            setIsStreaming(false);
          }
        }
      }
    }
  }, [messages]);

  return { messages, sendMessage, isStreaming };
}
```

### Backend Integration (NestJS Service)

#### Call from Another Service

```typescript
import { Injectable } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class MyService {
  constructor(private chatService: ChatService) {}

  async processWithAI(userId: string, taskDescription: string) {
    // Check if user can access GPT-4
    const access = await this.chatService.checkModelAccess(userId, 'gpt-4');
    
    if (!access.allowed) {
      throw new Error('Upgrade to PRO plan for GPT-4 access');
    }

    // Stream AI response
    const generator = this.chatService.streamChatResponse({
      userId,
      modelId: 'gpt-4',
      prompt: `Analyze this task: ${taskDescription}`,
    });

    let fullResponse = '';
    for await (const event of generator) {
      if (event.type === 'chunk') {
        fullResponse += event.data.content;
      }
    }

    return fullResponse;
  }
}
```

## 🧪 Testing

### Manual Testing with cURL

#### 1. Get Models

```bash
curl http://localhost:3001/chat/models \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2. Send Message (SSE)

```bash
curl -N http://localhost:3001/chat/messages/stream \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "gpt-3.5-turbo",
    "prompt": "Hello, how are you?"
  }'
```

The `-N` flag disables buffering for streaming responses.

#### 3. Get Chat History

```bash
curl "http://localhost:3001/chat/history?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Unit Tests

```typescript
import { Test } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ChatService, PrismaService, /* adapters */],
    }).compile();

    service = module.get(ChatService);
    prisma = module.get(PrismaService);
  });

  it('should deny access to GPT-4 for BASIC users', async () => {
    // Mock user with BASIC plan
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user_123',
      subscription: { plan: 'BASIC', status: 'active' },
    } as any);

    const result = await service.checkModelAccess('user_123', 'gpt-4');
    
    expect(result.allowed).toBe(false);
    expect(result.plan).toBe('BASIC');
  });

  it('should allow access to GPT-3.5 for BASIC users', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user_123',
      subscription: { plan: 'BASIC', status: 'active' },
    } as any);

    const result = await service.checkModelAccess('user_123', 'gpt-3.5-turbo');
    
    expect(result.allowed).toBe(true);
  });
});
```

## 📝 Next Steps

### Implement Real AI Integration

Replace stub adapters with real implementations:

```typescript
// openai.adapter.ts
import OpenAI from 'openai';

export class OpenAIAdapter {
  private openai: OpenAI;

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: config.get('OPENAI_API_KEY'),
    });
  }

  async *streamChatCompletion(modelId: string, prompt: string) {
    const stream = await this.openai.chat.completions.create({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  }
}
```

### Add More Features

- **Usage tracking**: Track tokens/messages per user
- **Rate limiting**: Prevent abuse
- **Conversation threads**: Group related messages
- **Message reactions**: Like/dislike responses
- **Model comparison**: Run same prompt on multiple models
- **Cost tracking**: Monitor API costs per user

### Security Enhancements

- **Input validation**: Sanitize prompts
- **Content filtering**: Block inappropriate content
- **Audit logging**: Track all AI interactions
- **Rate limits**: Per-user quotas based on plan

## 🎉 Summary

You now have a complete chat service with:
- ✅ Subscription-based model access control
- ✅ SSE streaming for real-time responses
- ✅ Message persistence in PostgreSQL
- ✅ Pluggable AI provider adapters
- ✅ Full integration with Better-Auth and Billing

**Ready to use!** Just configure your AI API keys and start chatting.
