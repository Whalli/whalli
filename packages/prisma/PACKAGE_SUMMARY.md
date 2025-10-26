# @whalli/prisma - Package Summary

## ✅ What's Been Created

### 📁 Structure
```
packages/prisma/
├── schema.prisma          # Complete database schema
├── src/
│   └── client.ts         # Singleton Prisma Client
├── index.ts              # Main export (backend only!)
├── seed.ts               # Database seeding script
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript config
├── README.md             # Comprehensive documentation
└── .env.example          # Environment template
```

### 🗄️ Database Schema

#### Models Created:

1. **User**
   - id, email (unique), name, password, role
   - Role enum: USER, ADMIN, MODERATOR
   - Relations: Has many Presets and Chats
   - Timestamps: createdAt, updatedAt

2. **Preset**
   - id, name, color, systemInstruction, userId
   - Color stored as hex (#3B82F6)
   - Relations: Belongs to User, has many Chats
   - Cascade delete: Deleted when user is deleted
   - Timestamps: createdAt, updatedAt

3. **Chat**
   - id, title, model, presetId (optional), userId
   - Model stores AI model identifier (e.g., "gpt-4")
   - Relations: Belongs to User and Preset (optional), has many Messages
   - Cascade delete: Deleted when user is deleted
   - SetNull: presetId becomes null when preset deleted
   - Timestamps: createdAt, updatedAt

4. **Message**
   - id, role, content, chatId
   - Role enum: USER, ASSISTANT, SYSTEM
   - Content stored as TEXT (large content support)
   - Relations: Belongs to Chat
   - Cascade delete: Deleted when chat is deleted
   - Timestamps: createdAt, updatedAt

### 🔐 Enums

```typescript
enum UserRole {
  USER
  ADMIN
  MODERATOR
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}
```

### 🔗 Relationships & Cascades

```
User (1:many) Preset
  ↓ CASCADE: Delete user → deletes all presets

User (1:many) Chat  
  ↓ CASCADE: Delete user → deletes all chats

Preset (1:many) Chat
  ↓ SET NULL: Delete preset → sets presetId to null

Chat (1:many) Message
  ↓ CASCADE: Delete chat → deletes all messages
```

### 📊 Indexes

Optimized queries with indexes on:
- `userId` in Preset table
- `userId` in Chat table
- `presetId` in Chat table
- `chatId` in Message table

## 🎯 Usage

### ✅ Backend Only

```typescript
import { prisma, User Role, MessageRole } from '@whalli/prisma';
import type { User, Chat, Message, Preset } from '@whalli/prisma';

// Use the singleton client
const users = await prisma.user.findMany();

// Create a chat with messages
const chat = await prisma.chat.create({
  data: {
    title: 'New Chat',
    model: 'gpt-4',
    userId: user.id,
    presetId: preset.id,
    messages: {
      create: [
        { role: MessageRole.USER, content: 'Hello!' },
        { role: MessageRole.ASSISTANT, content: 'Hi there!' },
      ],
    },
  },
  include: { messages: true },
});
```

### ❌ Never in Frontend

```typescript
// ❌ DO NOT DO THIS in apps/web or apps/admin
import { prisma } from '@whalli/prisma'; // NEVER!
```

## 🚀 Next Steps

### 1. Push Schema to Database

```bash
# From root
pnpm db:push

# Or from packages/prisma
pnpm --filter @whalli/prisma db:push
```

### 2. (Optional) Seed Database

```bash
pnpm --filter @whalli/prisma db:seed
```

This will create:
- Admin user (admin@whalli.com)
- Test user (test@whalli.com)
- 2 presets (Helpful Assistant, Code Expert)
- 1 sample chat with messages

### 3. Open Prisma Studio

```bash
pnpm db:studio
```

Visual database browser at http://localhost:5555

### 4. Update Backend Service

The `PrismaService` in `apps/backend/src/prisma/prisma.service.ts` is already configured to use the singleton client.

## 📝 Example Queries

### User with All Data

```typescript
const userWithEverything = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    presets: true,
    chats: {
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        preset: true,
      },
      orderBy: { updatedAt: 'desc' },
    },
  },
});
```

### Recent Chats

```typescript
const recentChats = await prisma.chat.findMany({
  where: { userId },
  include: {
    preset: true,
    messages: {
      take: 1,
      orderBy: { createdAt: 'desc' },
    },
  },
  orderBy: { updatedAt: 'desc' },
  take: 10,
});
```

### Create Message in Chat

```typescript
const message = await prisma.message.create({
  data: {
    role: MessageRole.USER,
    content: 'My question',
    chatId: chat.id,
  },
});
```

## 🔒 Security

### Isolation Enforced

1. **Package Configuration**: Only backend can import
2. **Documentation**: Clear warnings in README
3. **Architecture**: Frontend must use API
4. **Environment**: Database URL never exposed to frontend

### Best Practices

- ✅ All database access through backend API
- ✅ Frontend gets data via HTTP requests
- ✅ Credentials never in frontend code
- ✅ Proper separation of concerns

## 📚 Documentation

Complete documentation available in:
- `packages/prisma/README.md` - Full package docs
- Schema comments in `schema.prisma`
- Inline comments in `src/client.ts`

## 🎉 Summary

You now have:
- ✅ Complete database schema with 4 models
- ✅ Proper relationships and cascade deletes
- ✅ Singleton Prisma Client
- ✅ Type-safe client with TypeScript
- ✅ Optimized indexes
- ✅ Seed script for sample data
- ✅ Backend-only isolation enforced
- ✅ Comprehensive documentation

**Ready to use! 🚀**

Next: Update your backend controllers to use the new models!
