# ChatService Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React/Next.js)                 │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Model Select │  │ Chat Input   │  │ Streaming Display     │ │
│  │ (Dropdown)   │  │ (Textarea)   │  │ (Real-time text)      │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────────────────┘ │
│         │                  │                      ▲              │
└─────────┼──────────────────┼──────────────────────┼──────────────┘
          │                  │                      │
          │ GET /models      │ POST /messages/      │ SSE Stream
          │                  │ stream               │
          ▼                  ▼                      │
┌─────────────────────────────────────────────────────────────────┐
│                     ChatController (NestJS)                      │
│                                                                   │
│  @Get('models')           @Post('messages/stream') @Sse()        │
│  getModels()              streamMessage()                        │
│       │                          │                               │
│       └──────────┬───────────────┘                               │
│                  ▼                                                │
│            ChatService                                            │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  getAvailableModels()                                        │ │
│  │    ├─ Get user subscription from DB                         │ │
│  │    ├─ Check MODEL_ACCESS_MATRIX[plan]                       │ │
│  │    └─ Return filtered models                                │ │
│  │                                                              │ │
│  │  streamChatResponse()                                        │ │
│  │    ├─ 1. Check model access (subscription tier)             │ │
│  │    ├─ 2. Validate model exists in DB                        │ │
│  │    ├─ 3. Save user message → PostgreSQL                     │ │
│  │    ├─ 4. Stream AI response via adapter                     │ │
│  │    │    ├─ yield { type: 'message_saved', ... }             │ │
│  │    │    ├─ yield { type: 'chunk', content: '...' }          │ │
│  │    │    └─ yield { type: 'complete', ... }                  │ │
│  │    └─ 5. Save AI response → PostgreSQL                      │ │
│  │                                                              │ │
│  │  checkModelAccess()                                          │ │
│  │    ├─ Get user subscription                                 │ │
│  │    ├─ Check if modelId in allowed list                      │ │
│  │    └─ Return { allowed, plan, reason }                      │ │
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                  │                        │                      │
└──────────────────┼────────────────────────┼──────────────────────┘
                   │                        │
                   ▼                        ▼
       ┌───────────────────────┐  ┌─────────────────────┐
       │   Model Adapters       │  │   PrismaService     │
       │                        │  │                     │
       │  OpenAIAdapter         │  │  ┌───────────────┐ │
       │  ┌──────────────────┐  │  │  │ User          │ │
       │  │ streamCompletion │  │  │  │ Subscription  │ │
       │  │ (stub/real API)  │  │  │  │ Model         │ │
       │  └──────────────────┘  │  │  │ Message       │ │
       │                        │  │  │ Company       │ │
       │  AnthropicAdapter      │  │  └───────────────┘ │
       │  ┌──────────────────┐  │  │                     │
       │  │ streamCompletion │  │  │   PostgreSQL        │
       │  │ (stub/real API)  │  │  │                     │
       │  └──────────────────┘  │  └─────────────────────┘
       │                        │
       └───────────┬────────────┘
                   │
                   ▼
       ┌───────────────────────┐
       │   External AI APIs     │
       │                        │
       │  ┌──────────────────┐  │
       │  │  OpenAI API      │  │
       │  │  (GPT models)    │  │
       │  └──────────────────┘  │
       │                        │
       │  ┌──────────────────┐  │
       │  │  Anthropic API   │  │
       │  │  (Claude models) │  │
       │  └──────────────────┘  │
       │                        │
       └────────────────────────┘
```

## Subscription-Based Access Control

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODEL_ACCESS_MATRIX                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BASIC Plan ($9.99/mo)                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ✅ gpt-3.5-turbo      (OpenAI)                           │    │
│  │ ✅ claude-3-haiku     (Anthropic)                        │    │
│  │ ❌ gpt-4                                                  │    │
│  │ ❌ gpt-4-turbo                                            │    │
│  │ ❌ claude-3-sonnet                                        │    │
│  │ ❌ claude-3-opus                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  PRO Plan ($29.99/mo)                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ✅ gpt-3.5-turbo      (OpenAI)                           │    │
│  │ ✅ gpt-3.5-turbo-16k  (OpenAI)                           │    │
│  │ ✅ gpt-4              (OpenAI)                           │    │
│  │ ✅ claude-3-haiku     (Anthropic)                        │    │
│  │ ✅ claude-3-sonnet    (Anthropic)                        │    │
│  │ ✅ claude-2.1         (Anthropic)                        │    │
│  │ ❌ gpt-4-turbo                                            │    │
│  │ ❌ claude-3-opus                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ENTERPRISE Plan ($99.99/mo)                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ✅ ALL MODELS                                            │    │
│  │   - gpt-3.5-turbo, gpt-4, gpt-4-turbo                   │    │
│  │   - claude-3-haiku, claude-3-sonnet, claude-3-opus      │    │
│  │   - Future models automatically included                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Message Flow (SSE Streaming)

```
Time ──────────────────────────────────────────────────────────────►

User Action:
   │
   │ Click "Send" button
   │
   ▼
┌──────────────────────────────────────────────────────────────────┐
│ POST /chat/messages/stream                                        │
│ { modelId: "gpt-4", prompt: "Explain React hooks" }              │
└──────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────┐
│ ChatService.checkModelAccess()                                    │
│   ✅ User has PRO plan → GPT-4 allowed                            │
└──────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────┐
│ prisma.message.create() → Save user message                       │
│ "Explain React hooks"                                             │
└──────────────────────────────────────────────────────────────────┘
   │
   ▼ SSE Event 1
┌──────────────────────────────────────────────────────────────────┐
│ data: {"type":"message_saved","data":{"messageId":"msg_123"}}    │
└──────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────┐
│ OpenAIAdapter.streamChatCompletion("gpt-4", "Explain...")         │
└──────────────────────────────────────────────────────────────────┘
   │
   ▼ SSE Event 2 (50ms later)
┌──────────────────────────────────────────────────────────────────┐
│ data: {"type":"chunk","data":{"content":"React "}}               │
└──────────────────────────────────────────────────────────────────┘
   │
   ▼ SSE Event 3 (50ms later)
┌──────────────────────────────────────────────────────────────────┐
│ data: {"type":"chunk","data":{"content":"hooks "}}               │
└──────────────────────────────────────────────────────────────────┘
   │
   ▼ SSE Event 4 (50ms later)
┌──────────────────────────────────────────────────────────────────┐
│ data: {"type":"chunk","data":{"content":"are "}}                 │
└──────────────────────────────────────────────────────────────────┘
   │
   ▼ ... (more chunks)
   │
   ▼
┌──────────────────────────────────────────────────────────────────┐
│ prisma.message.create() → Save AI response                        │
│ "React hooks are functions that let you..."                       │
└──────────────────────────────────────────────────────────────────┘
   │
   ▼ SSE Event Final
┌──────────────────────────────────────────────────────────────────┐
│ data: {"type":"complete","data":{                                 │
│   "messageId":"msg_456",                                          │
│   "fullResponse":"React hooks are functions that let you..."      │
│ }}                                                                │
└──────────────────────────────────────────────────────────────────┘
   │
   ▼
   Stream closed
```

## Database Relationships

```
┌─────────────────┐
│     User        │
│─────────────────│
│ id              │◄─────┐
│ email           │      │
│ subscriptionId  │──┐   │
│ name            │  │   │
│ role            │  │   │
└─────────────────┘  │   │
                     │   │
                     ▼   │
         ┌──────────────────────┐
         │   Subscription       │
         │──────────────────────│
         │ id                   │
         │ userId               │
         │ plan ◄───────────────┼─── Determines model access
         │ status               │
         │ stripeSubscriptionId │
         └──────────────────────┘

┌─────────────────┐
│    Company      │
│─────────────────│
│ id              │◄─────┐
│ name            │      │
│ logoUrl         │      │
└─────────────────┘      │
                         │
                         │
         ┌───────────────┴──────┐
         │      Model           │
         │──────────────────────│
         │ id                   │◄─────┐
         │ companyId            │      │
         │ name                 │      │
         │ description          │      │
         │ capabilities (JSON)  │      │
         │ latencyHint          │      │
         │ costEstimate         │      │
         └──────────────────────┘      │
                                       │
┌─────────────────┐                    │
│     User        │                    │
│─────────────────│                    │
│ id              │◄─────┐             │
└─────────────────┘      │             │
                         │             │
         ┌───────────────┴────────┬────┘
         │      Message           │
         │────────────────────────│
         │ id                     │
         │ userId                 │
         │ content                │
         │ modelId                │
         │ projectId (optional)   │
         │ taskId (optional)      │
         │ createdAt              │
         └────────────────────────┘
                  │
                  │ 1:N
                  ▼
         ┌────────────────────────┐
         │    Attachment          │
         │────────────────────────│
         │ id                     │
         │ messageId              │
         │ url                    │
         │ type                   │
         │ metadata (JSON)        │
         └────────────────────────┘
```

## File Structure

```
apps/api/
├── src/
│   └── chat/
│       ├── adapters/
│       │   ├── openai.adapter.ts       ─┐
│       │   └── anthropic.adapter.ts    ─┤─ AI Provider Integration
│       │                                 │
│       ├── dto/
│       │   └── send-message.dto.ts     ─── Request Validation
│       │
│       ├── chat.controller.ts          ─── REST + SSE Endpoints
│       ├── chat.service.ts             ─── Business Logic
│       └── chat.module.ts              ─── Module Config
│
├── prisma/
│   ├── schema.prisma                   ─── Database Schema
│   ├── seed.ts                         ─── TypeScript Seeder
│   └── seed-models.sql                 ─── SQL Seeder
│
├── CHAT_SERVICE.md                     ─┐
├── CHAT_SERVICE_README.md              ─┤─ Documentation
├── CHAT_SERVICE_SUMMARY.md             ─┤
└── CHAT_SERVICE_DIAGRAM.md             ─┘
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                         Technology Stack                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Backend Framework:    NestJS 10.3+                              │
│  Database:             PostgreSQL                                 │
│  ORM:                  Prisma 5.10+                              │
│  Authentication:       Better-Auth (JWT)                          │
│  Billing:              Stripe                                     │
│  Streaming:            Server-Sent Events (SSE)                   │
│  Validation:           class-validator, class-transformer         │
│  AI Providers:         OpenAI, Anthropic (stub → real)           │
│  Async:                RxJS Observables                           │
│  TypeScript:           5.3+                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. **Subscription-Based Access**
   - User subscription plan determines available models
   - Enforced at API level before expensive AI calls
   - Graceful degradation (BASIC if no subscription)

### 2. **Server-Sent Events (SSE)**
   - Unidirectional streaming (server → client)
   - Works over HTTP (no WebSocket needed)
   - Event-based: message_saved, chunk, complete, error

### 3. **Async Generators**
   - `async function*` for streaming
   - `yield` emits chunks to client
   - Clean separation of concerns

### 4. **Adapter Pattern**
   - Pluggable AI providers
   - Easy to add new providers
   - Consistent interface

### 5. **Message Persistence**
   - All conversations saved
   - Full audit trail
   - Links to projects/tasks

---

**Created**: October 3, 2025
**Status**: ✅ Complete - Ready for integration
**Next Step**: Add real AI API keys and test with actual providers
