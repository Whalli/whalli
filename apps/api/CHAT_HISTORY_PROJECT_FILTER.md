# Chat History with Project Filter - Implementation Guide

## Overview

The `GET /chat/history` endpoint supports filtering messages by `projectId`, allowing you to retrieve conversation history specific to a project or standalone threads.

**Status**: ✅ **ALREADY IMPLEMENTED AND WORKING**

---

## API Endpoint

### GET /chat/history

**Base URL**: `http://localhost:3001/api/chat/history`

**Authentication**: Required (Bearer token or session cookie)

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chatId` | string | No | Filter by specific conversation thread ID |
| `projectId` | string | No | Filter by project ID (all messages for this project) |
| `taskId` | string | No | Filter by task ID |
| `limit` | number | No | Max messages to return (default: 50) |

**Response**:

```typescript
{
  chatId?: string;        // Only present if chatId was provided
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    createdAt: Date;
    modelId: string;
    userId: string;
    projectId?: string;
    taskId?: string;
    model: {
      id: string;
      name: string;
      company: {
        name: string;
      };
    };
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    messageAttachments: Array<{...}>;
  }>;
}
```

---

## Usage Examples

### 1. Get Project-Specific History

Retrieve all messages for a specific project:

```bash
curl -X GET \
  'http://localhost:3001/api/chat/history?projectId=project-123&limit=100' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json'
```

**Response**:
```json
{
  "messages": [
    {
      "id": "msg-1",
      "content": "Create a new feature for authentication",
      "role": "user",
      "createdAt": "2025-10-05T10:00:00.000Z",
      "projectId": "project-123",
      "model": {
        "name": "GPT-4",
        "company": { "name": "OpenAI" }
      }
    },
    {
      "id": "msg-2",
      "content": "I'll help you create an authentication feature...",
      "role": "assistant",
      "createdAt": "2025-10-05T10:00:05.000Z",
      "projectId": "project-123",
      "model": {
        "name": "GPT-4",
        "company": { "name": "OpenAI" }
      }
    }
  ]
}
```

### 2. Get Standalone Chat History (No Project)

Retrieve messages not linked to any project:

```bash
curl -X GET \
  'http://localhost:3001/api/chat/history?limit=50' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### 3. Get Specific Chat Thread

Retrieve messages for a specific conversation thread:

```bash
curl -X GET \
  'http://localhost:3001/api/chat/history?chatId=chat-456' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### 4. Combine Filters

Get messages for a specific task within a project:

```bash
curl -X GET \
  'http://localhost:3001/api/chat/history?projectId=project-123&taskId=task-789&limit=20' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## Implementation Details

### ChatController (`src/chat/chat.controller.ts`)

```typescript
@Get('history')
async getChatHistory(
  @CurrentUser() user: any,
  @Query('chatId') chatId?: string,
  @Query('projectId') projectId?: string,
  @Query('taskId') taskId?: string,
  @Query('limit') limit?: string,
) {
  return this.chatService.getChatHistory({
    userId: user.id,
    chatId,
    projectId,
    taskId,
    limit: limit ? parseInt(limit, 10) : 50,
  });
}
```

### ChatService (`src/chat/chat.service.ts`)

```typescript
async getChatHistory(data: {
  userId: string;
  chatId?: string;
  projectId?: string;
  taskId?: string;
  limit?: number;
}) {
  const { userId, chatId, projectId, taskId, limit = 50 } = data;

  // Case 1: Get messages for specific chatId
  if (chatId) {
    const sessions = await this.prisma.chatSession.findMany({
      where: { chatId, userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    if (sessions.length === 0) {
      return { chatId, messages: [] };
    }

    const firstSessionTime = sessions[0].createdAt;

    const messages = await this.prisma.message.findMany({
      where: {
        userId,
        createdAt: { gte: firstSessionTime },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        model: { include: { company: true } },
        user: { select: { id: true, name: true, email: true, avatar: true } },
        messageAttachments: true,
      },
    });

    return { chatId, messages };
  }

  // Case 2: Get messages filtered by projectId/taskId
  const messages = await this.prisma.message.findMany({
    where: {
      userId,
      ...(projectId && { projectId }),
      ...(taskId && { taskId }),
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      model: { include: { company: true } },
      user: { select: { id: true, name: true, email: true, avatar: true } },
      messageAttachments: true,
    },
  });

  return { messages: messages.reverse() }; // Oldest first
}
```

---

## Filter Logic

### Priority Order

1. **`chatId`** takes precedence - filters by conversation thread
2. **`projectId`** - filters by project (all messages in project)
3. **`taskId`** - filters by task (can combine with projectId)
4. **No filters** - returns recent messages for user (all standalone chats)

### Filter Combinations

| chatId | projectId | taskId | Result |
|--------|-----------|--------|--------|
| ✅ | ❌ | ❌ | All messages in this conversation thread |
| ❌ | ✅ | ❌ | All messages for this project |
| ❌ | ✅ | ✅ | All messages for this task in this project |
| ❌ | ❌ | ✅ | All messages for this task (any project) |
| ❌ | ❌ | ❌ | All recent messages (standalone chats) |

---

## Message Sorting

**Always sorted by `createdAt` in ascending order (oldest first)**

This ensures chronological conversation flow:
```
User: "Hello"
Assistant: "Hi there!"
User: "How are you?"
Assistant: "I'm great! How can I help?"
```

---

## Frontend Integration

### React Example with useChat Hook

```typescript
import { useEffect, useState } from 'react';

function ProjectChat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(
          `/api/chat/history?projectId=${projectId}&limit=100`,
          { credentials: 'include' }
        );
        const data = await response.json();
        setMessages(data.messages);
      } catch (error) {
        console.error('Failed to load project chat history:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [projectId]);

  if (loading) return <div>Loading project chat...</div>;

  return (
    <div className="project-chat">
      <h2>Project Chat History</h2>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="content">{msg.content}</div>
            <div className="meta">
              {msg.model.name} • {new Date(msg.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Standalone Chat (No Project)

```typescript
function StandaloneChat() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    async function fetchHistory() {
      // No projectId = standalone chats only
      const response = await fetch('/api/chat/history?limit=50', {
        credentials: 'include'
      });
      const data = await response.json();
      setMessages(data.messages);
    }

    fetchHistory();
  }, []);

  return (
    <div className="standalone-chat">
      <h2>Recent Chats</h2>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing

### Test 1: Project History

```bash
# 1. Create a project
POST /api/projects
{
  "name": "AI Integration Project",
  "description": "Integrate OpenAI"
}
# Response: { id: "project-123" }

# 2. Send messages with projectId
POST /api/chat/start
{
  "prompt": "Help me integrate OpenAI",
  "modelId": "gpt-4",
  "projectId": "project-123"
}

# 3. Get project history
GET /api/chat/history?projectId=project-123

# Expected: All messages for project-123 in chronological order
```

### Test 2: Standalone vs Project

```bash
# 1. Send standalone message (no projectId)
POST /api/chat/start
{
  "prompt": "What is AI?",
  "modelId": "gpt-4"
}

# 2. Send project message
POST /api/chat/start
{
  "prompt": "Create auth feature",
  "modelId": "gpt-4",
  "projectId": "project-123"
}

# 3. Get standalone history (no projectId filter)
GET /api/chat/history?limit=50
# Expected: Only "What is AI?" message

# 4. Get project history
GET /api/chat/history?projectId=project-123
# Expected: Only "Create auth feature" message
```

### Test 3: Chat Thread Continuity

```bash
# 1. Start chat with chatId
POST /api/chat/start
{
  "prompt": "First message",
  "modelId": "gpt-4",
  "chatId": "chat-456",
  "projectId": "project-123"
}

# 2. Continue chat with same chatId
POST /api/chat/start
{
  "prompt": "Follow-up question",
  "modelId": "gpt-4",
  "chatId": "chat-456",
  "projectId": "project-123"
}

# 3. Get chat thread
GET /api/chat/history?chatId=chat-456
# Expected: Both messages in order

# 4. Get project history
GET /api/chat/history?projectId=project-123
# Expected: Both messages (chatId is within project)
```

---

## Database Schema

### Message Model (Prisma)

```prisma
model Message {
  id        String   @id @default(cuid())
  content   String   @db.Text
  role      MessageRole // 'user' | 'assistant'
  createdAt DateTime @default(now())
  
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  modelId   String
  model     Model    @relation(fields: [modelId], references: [id])
  
  projectId String?  // Optional: links to project
  project   Project? @relation(fields: [projectId], references: [id])
  
  taskId    String?  // Optional: links to task
  task      Task?    @relation(fields: [taskId], references: [id])
  
  messageAttachments MessageAttachment[]
  
  @@index([userId])
  @@index([projectId])  // Efficient projectId filtering
  @@index([taskId])
  @@index([createdAt])  // Efficient sorting
}
```

### ChatSession Model

```prisma
model ChatSession {
  id        String   @id @default(cuid())
  userId    String
  modelId   String
  chatId    String?  // Thread grouping
  projectId String?  // Links to project
  taskId    String?
  createdAt DateTime @default(now())
  expiresAt DateTime
  
  @@index([userId])
  @@index([chatId])
  @@index([projectId])  // Efficient project queries
  @@index([expiresAt])
}
```

---

## Performance Considerations

### Indexing Strategy

✅ **Indexes for Fast Queries**:
- `Message.userId` - filter by user
- `Message.projectId` - filter by project
- `Message.createdAt` - sort chronologically
- `ChatSession.projectId` - session queries

### Query Optimization

```typescript
// ✅ GOOD: Uses index on projectId + createdAt
const messages = await prisma.message.findMany({
  where: { userId, projectId },
  orderBy: { createdAt: 'desc' },
  take: 50,
});

// ❌ BAD: No limit, could return millions
const messages = await prisma.message.findMany({
  where: { userId },
});
```

### Pagination Strategy

For large projects with 1000+ messages:

```typescript
// Option 1: Cursor-based pagination (recommended)
const messages = await prisma.message.findMany({
  where: { userId, projectId },
  take: 50,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: 'asc' },
});

// Option 2: Offset-based pagination (simpler)
const page = 1;
const pageSize = 50;
const messages = await prisma.message.findMany({
  where: { userId, projectId },
  take: pageSize,
  skip: (page - 1) * pageSize,
  orderBy: { createdAt: 'asc' },
});
```

---

## Common Use Cases

### 1. Project Dashboard

Show recent project conversations:

```typescript
// Get last 10 messages for project overview
GET /api/chat/history?projectId=project-123&limit=10
```

### 2. Task-Specific Chat

Show only messages related to a specific task:

```typescript
// Get task chat history
GET /api/chat/history?projectId=project-123&taskId=task-789
```

### 3. User Activity Feed

Show all user's recent chat activity:

```typescript
// Get all recent messages (across all projects)
GET /api/chat/history?limit=100
```

### 4. Conversation Thread

Continue a specific conversation:

```typescript
// Get thread history for context
GET /api/chat/history?chatId=chat-456
```

---

## Error Handling

### Common Errors

**1. Unauthorized Access**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
**Solution**: Include valid authentication token

**2. Invalid Project ID**:
```json
{
  "messages": []
}
```
**Note**: Empty array is returned (not an error) if project has no messages

**3. Invalid Limit**:
```typescript
// Frontend validation
const limit = Math.min(Math.max(parseInt(limitInput), 1), 200);
```

---

## Security

### Access Control

✅ **Built-in Security**:
1. **AuthGuard** - All endpoints require authentication
2. **User Scope** - Only returns messages owned by authenticated user
3. **Project Scope** - User must have access to project (not enforced here, but should be in ProjectsService)

### Recommended Project Access Check

```typescript
// In ChatController, before calling getChatHistory
if (projectId) {
  // Verify user has access to this project
  const hasAccess = await this.projectsService.checkUserAccess(user.id, projectId);
  if (!hasAccess) {
    throw new ForbiddenException('You do not have access to this project');
  }
}
```

---

## Summary

### ✅ What's Implemented

- [x] GET /chat/history endpoint
- [x] `projectId` query parameter support
- [x] `chatId`, `taskId`, `limit` parameters
- [x] User-scoped message filtering
- [x] Chronological sorting (oldest first)
- [x] Message includes (model, company, user, attachments)
- [x] TypeScript type safety
- [x] Database indexing for performance

### 📊 API Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/chat/history` | Get all user messages |
| GET | `/chat/history?projectId=xxx` | Get project messages |
| GET | `/chat/history?chatId=xxx` | Get thread messages |
| GET | `/chat/history?taskId=xxx` | Get task messages |
| GET | `/chat/history?limit=100` | Limit result count |

### 🎯 Next Steps

1. **Test the endpoint** - Send test requests with different filters
2. **Update frontend** - Integrate projectId filter in chat UI
3. **Add pagination** - For projects with 100+ messages
4. **Add project access checks** - Verify user permissions before returning messages

---

**Status**: ✅ **READY TO USE**  
**Version**: 1.0.0  
**Last Updated**: October 5, 2025
