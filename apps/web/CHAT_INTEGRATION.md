# Chat UI Integration Guide

## 🚀 Integration with Whalli Monorepo

This guide shows how to integrate the Chat UI components with the existing Whalli infrastructure.

---

## 📁 Project Structure

```
whalli/
├── apps/
│   ├── web/                          # Next.js Web App (Port 3000)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── chat/            # ✅ NEW: Chat UI Components
│   │   │   │       ├── ChatUI.tsx
│   │   │   │       ├── ChatSidebar.tsx
│   │   │   │       ├── ChatMessages.tsx
│   │   │   │       ├── ChatInput.tsx
│   │   │   │       ├── StreamingText.tsx
│   │   │   │       ├── SlashCommandAutocomplete.tsx
│   │   │   │       ├── VoiceRecorder.tsx
│   │   │   │       ├── FileUpload.tsx
│   │   │   │       └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useChatModels.ts  # ✅ NEW
│   │   │   │   ├── useChat.ts        # ✅ NEW
│   │   │   │   ├── useSlashCommands.ts # ✅ NEW
│   │   │   │   └── index.ts
│   │   │   └── app/
│   │   │       ├── chat/
│   │   │       │   └── page.tsx      # ✅ NEW: Demo page
│   │   │       └── dashboard/
│   │   │           └── page.tsx      # 🔄 UPDATE: Add chat
│   │   └── package.json
│   │
│   └── api/                          # NestJS API (Port 3001)
│       ├── src/
│       │   ├── chat/                 # 🔄 CREATE: Chat module
│       │   │   ├── chat.controller.ts
│       │   │   ├── chat.service.ts
│       │   │   ├── chat.module.ts
│       │   │   └── dto/
│       │   ├── files/                # Already exists
│       │   │   └── files.controller.ts  # 🔄 UPDATE: Add transcription
│       │   └── utils/
│       │       └── slash-command-parser.ts  # ✅ EXISTS
│       └── package.json
│
└── packages/
    ├── ui/                           # Shared UI Components
    │   └── src/
    │       └── chat/                 # 🔄 OPTIONAL: Move chat here for reuse
    └── types/                        # Shared Types
        └── src/
            └── chat.ts               # 🔄 CREATE: Shared chat types
```

---

## 🔌 Backend Integration (NestJS)

### Step 1: Create Chat Module

Create `apps/api/src/chat/chat.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
```

### Step 2: Create Chat Controller

Create `apps/api/src/chat/chat.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Get available AI models
  @Get('models')
  async getModels() {
    return this.chatService.getAvailableModels();
  }

  // Send message and stream response
  @Post('messages')
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ) {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Get streaming response from AI service
      const stream = await this.chatService.sendMessage(
        userId,
        dto.modelId,
        dto.message,
      );

      // Stream chunks to client
      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  // Get chat history
  @Get('history')
  async getHistory(@CurrentUser('id') userId: string) {
    return this.chatService.getChatHistory(userId);
  }
}
```

### Step 3: Create Chat Service

Create `apps/api/src/chat/chat.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getAvailableModels() {
    // Return list of available AI models
    return {
      models: [
        {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          company: 'OpenAI',
          description: 'Most capable GPT-4 model with improved performance',
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          company: 'OpenAI',
          description: 'Fast and efficient for most tasks',
        },
        {
          id: 'claude-3-opus',
          name: 'Claude 3 Opus',
          company: 'Anthropic',
          description: 'Most powerful Claude model',
        },
        {
          id: 'claude-3-sonnet',
          name: 'Claude 3 Sonnet',
          company: 'Anthropic',
          description: 'Balanced performance and speed',
        },
        {
          id: 'gemini-pro',
          name: 'Gemini Pro',
          company: 'Google',
          description: "Google's most capable AI model",
        },
      ],
    };
  }

  async *sendMessage(
    userId: string,
    modelId: string,
    message: string,
  ): AsyncGenerator<string> {
    // Save message to database
    await this.prisma.chatMessage.create({
      data: {
        userId,
        modelId,
        content: message,
        role: 'user',
      },
    });

    // Call AI service (OpenAI, Anthropic, etc.)
    // This is a mock implementation - replace with actual AI API calls
    const response = await this.callAIModel(modelId, message);

    // Stream response in chunks
    for (let i = 0; i < response.length; i += 5) {
      yield response.slice(i, i + 5);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Save assistant message to database
    await this.prisma.chatMessage.create({
      data: {
        userId,
        modelId,
        content: response,
        role: 'assistant',
      },
    });
  }

  private async callAIModel(modelId: string, message: string): Promise<string> {
    // TODO: Implement actual AI API calls
    // Example with OpenAI:
    // const openai = new OpenAI({ apiKey: this.config.get('OPENAI_API_KEY') });
    // const response = await openai.chat.completions.create({
    //   model: modelId,
    //   messages: [{ role: 'user', content: message }],
    //   stream: true,
    // });
    // return response;

    return `This is a mock response to: "${message}". Replace with actual AI integration.`;
  }

  async getChatHistory(userId: string) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { messages };
  }
}
```

### Step 4: Update Files Module

Update `apps/api/src/files/files.controller.ts` to add transcription:

```typescript
// Add this endpoint to existing FilesController
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async uploadFile(
  @UploadedFile() file: Express.Multer.File,
  @Body('type') type: 'audio' | 'image' | 'document',
) {
  // Handle file upload
  const fileUrl = await this.filesService.upload(file);

  // If audio file, transcribe it
  let transcription: string | undefined;
  if (type === 'audio') {
    transcription = await this.filesService.transcribeAudio(file.buffer);
  }

  return {
    filename: file.originalname,
    url: fileUrl,
    transcription,
  };
}
```

### Step 5: Update App Module

Update `apps/api/src/app.module.ts`:

```typescript
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    FilesModule,
    ChatModule, // ✅ ADD THIS
    BillingModule,
  ],
})
export class AppModule {}
```

---

## 🗄️ Database Schema

Add to `apps/api/prisma/schema.prisma`:

```prisma
model ChatMessage {
  id        String   @id @default(cuid())
  userId    String
  modelId   String
  role      String   // 'user' or 'assistant'
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@map("chat_messages")
}

// Add to User model:
model User {
  // ... existing fields
  chatMessages ChatMessage[]
}
```

Run migration:
```bash
pnpm --filter=@whalli/api prisma migrate dev --name add_chat_messages
```

---

## 🌐 Frontend Integration

### Option 1: Standalone Chat Page (Already Done)

Visit: `http://localhost:3000/chat`

### Option 2: Dashboard Integration

Update `apps/web/src/app/dashboard/page.tsx`:

```tsx
import { ChatUI } from '@/components/chat';

export default function DashboardPage() {
  // Get user from auth
  const userId = 'user-id-from-auth';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen">
      {/* Main dashboard content */}
      <div className="lg:col-span-2 p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        {/* Your existing dashboard widgets */}
      </div>

      {/* Chat sidebar */}
      <div className="border-l border-gray-200">
        <ChatUI 
          userId={userId} 
          apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}
        />
      </div>
    </div>
  );
}
```

### Option 3: Floating Chat Widget

Create `apps/web/src/components/chat/ChatWidget.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ChatUI } from './ChatUI';

export function ChatWidget({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 z-50"
      >
        💬
      </button>

      {/* Chat popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl z-50 overflow-hidden">
          <ChatUI userId={userId} />
        </div>
      )}
    </>
  );
}
```

Add to any page:
```tsx
import { ChatWidget } from '@/components/chat/ChatWidget';

export default function Page() {
  return (
    <>
      {/* Your page content */}
      <ChatWidget userId="user-123" />
    </>
  );
}
```

---

## 🔐 Authentication Integration

### With Better Auth

Update `apps/web/src/hooks/useChat.ts`:

```typescript
import { useSession } from '@/lib/auth-client';

export function useChat(modelId: string | undefined, apiUrl: string) {
  const { data: session } = useSession();
  
  const sendMessage = async (content: string) => {
    if (!session?.user) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${apiUrl}/chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send cookies
      body: JSON.stringify({
        modelId,
        message: content,
      }),
    });

    // ... rest of implementation
  };

  return { messages, sendMessage, isStreaming };
}
```

---

## 📦 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Backend (.env)
```env
# OpenAI (for GPT models)
OPENAI_API_KEY=sk-...

# Anthropic (for Claude models)
ANTHROPIC_API_KEY=sk-ant-...

# Google (for Gemini models)
GOOGLE_API_KEY=...

# For audio transcription
WHISPER_API_KEY=...
```

---

## 🧪 Testing the Integration

### 1. Start Backend
```bash
cd /home/geekmonstar/code/projects/whalli
pnpm --filter=@whalli/api start:dev
```

### 2. Start Frontend
```bash
pnpm --filter=@whalli/web dev
```

### 3. Test Chat
1. Visit http://localhost:3000/chat
2. Select an AI model from sidebar
3. Type a message and press Enter
4. Verify streaming response works
5. Test slash commands (type `/`)
6. Test file upload (click paperclip)
7. Test voice recording (click mic)

---

## 🚀 Deployment Considerations

### 1. API Rate Limiting
```typescript
// Add to chat.controller.ts
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
```

### 2. Message Persistence
- Chat history stored in PostgreSQL
- Consider adding Redis for session caching
- Implement pagination for long histories

### 3. Streaming Optimization
- Use WebSockets for better performance
- Implement connection pooling
- Add retry logic for failed streams

### 4. Security
- Sanitize user input (XSS prevention)
- Implement CSRF protection
- Add content filtering (profanity, PII)
- Rate limit API calls
- Validate file uploads (size, type)

---

## 📊 Monitoring & Analytics

### Track Usage
```typescript
// In ChatService
async sendMessage(userId: string, modelId: string, message: string) {
  // Log analytics
  await this.analytics.track('chat_message_sent', {
    userId,
    modelId,
    messageLength: message.length,
    timestamp: new Date(),
  });

  // ... rest of implementation
}
```

### Metrics to Track
- Messages sent per user
- Average response time
- Model usage distribution
- Error rates
- Transcription success rate
- File upload success rate

---

## 🎯 Next Steps

### Phase 1: Core Integration (Week 1)
- [x] Create Chat UI components
- [ ] Implement backend chat module
- [ ] Add database schema
- [ ] Connect frontend to backend
- [ ] Test end-to-end flow

### Phase 2: AI Integration (Week 2)
- [ ] Integrate OpenAI API
- [ ] Integrate Anthropic API
- [ ] Add streaming support
- [ ] Implement token counting
- [ ] Add cost tracking

### Phase 3: Enhanced Features (Week 3)
- [ ] Add chat history
- [ ] Implement file uploads
- [ ] Add voice transcription (Whisper)
- [ ] Support markdown rendering
- [ ] Add code syntax highlighting

### Phase 4: Polish (Week 4)
- [ ] Add error handling
- [ ] Implement retry logic
- [ ] Add loading states
- [ ] Write tests
- [ ] Performance optimization
- [ ] Deploy to production

---

## 🐛 Common Integration Issues

### Issue: CORS Errors
**Solution**: Update `apps/api/src/main.ts`:
```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

### Issue: Authentication Failing
**Solution**: Check cookie settings in Better Auth config

### Issue: Streaming Not Working
**Solution**: Ensure Server-Sent Events headers are set correctly

### Issue: File Upload Failing
**Solution**: Check Multer configuration and file size limits

---

## 📞 Support

For integration help:
1. Check CHAT_UI.md documentation
2. Review CHAT_QUICKSTART.md guide
3. Check browser console for errors
4. Verify API endpoints are accessible
5. Test with Postman/curl first

Happy integrating! 🎉
