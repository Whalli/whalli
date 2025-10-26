# @whalli/prisma

Database schema and Prisma Client for the Whalli monorepo.

## ⚠️ CRITICAL: BACKEND ONLY PACKAGE

**This package should ONLY be imported by `apps/backend`.**

### ❌ DO NOT import this in:
- `apps/web` (Next.js Web)
- `apps/admin` (Next.js Admin)
- `packages/ui`
- `packages/utils`
- Any other frontend code

### ✅ ONLY import this in:
- `apps/backend` (NestJS Backend)

## Why Backend Only?

1. **Security**: Prevents exposing database credentials to the frontend
2. **Separation of Concerns**: Frontend should communicate via API only
3. **Best Practice**: Backend owns all database access
4. **Type Safety**: Prevents accidental database queries from frontend

## Architecture

```
┌─────────────┐
│   Frontend  │  
│ (web/admin) │  ❌ No direct DB access
└──────┬──────┘
       │
       │ HTTP API
       ▼
┌─────────────┐
│   Backend   │  ✅ Uses @whalli/prisma
│   (NestJS)  │
└──────┬──────┘
       │
       │ Prisma Client
       ▼
┌─────────────┐
│  PostgreSQL │
│  Database   │
└─────────────┘
```

## Usage (Backend Only)

### Import the Singleton Client

```typescript
import { prisma } from '@whalli/prisma';

// Use the client
const users = await prisma.user.findMany();
const chat = await prisma.chat.create({
  data: {
    title: 'New Chat',
    model: 'gpt-4',
    userId: '...',
  },
});
```

### Import Types

```typescript
import type { User, Chat, Message, Preset } from '@whalli/prisma';
import type { UserRole, MessageRole } from '@whalli/prisma';
```

## Database Schema

### Models

#### User
- Represents application users
- Fields: id, email, name, password, role, createdAt, updatedAt
- Relations: Has many presets and chats
- Role: USER, ADMIN, or MODERATOR

#### Preset
- AI conversation presets/templates
- Fields: id, name, color, systemInstruction, userId, createdAt, updatedAt
- Relations: Belongs to user, has many chats
- OnDelete: Cascade (deletes when user deleted)

#### Chat
- Represents a conversation
- Fields: id, title, model, presetId?, userId, createdAt, updatedAt
- Relations: Belongs to user and preset (optional), has many messages
- OnDelete: Cascade (deletes when user deleted), SetNull for preset

#### Message
- Individual messages in a chat
- Fields: id, role, content, chatId, createdAt, updatedAt
- Relations: Belongs to chat
- Role: USER, ASSISTANT, or SYSTEM
- OnDelete: Cascade (deletes when chat deleted)

### Relationships

```
User (1) ─────< (many) Preset
User (1) ─────< (many) Chat
Preset (1) ───< (many) Chat (optional)
Chat (1) ─────< (many) Message
```

## Scripts

```bash
# Generate Prisma Client (run after schema changes)
pnpm --filter @whalli/prisma generate

# Push schema to database (development)
pnpm --filter @whalli/prisma db:push

# Create a migration
pnpm --filter @whalli/prisma migrate:dev

# Deploy migrations (production)
pnpm --filter @whalli/prisma migrate:deploy

# Open Prisma Studio (database GUI)
pnpm --filter @whalli/prisma studio
```

Or use the root-level shortcuts:

```bash
pnpm db:generate
pnpm db:push
pnpm db:migrate
pnpm db:studio
```

## Example Queries

### Users

```typescript
// Create user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    password: 'hashed_password',
    role: 'USER',
  },
});

// Find user with relations
const userWithData = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    presets: true,
    chats: {
      include: {
        messages: true,
      },
    },
  },
});
```

### Chats

```typescript
// Create chat with messages
const chat = await prisma.chat.create({
  data: {
    title: 'AI Assistant Chat',
    model: 'gpt-4',
    userId: user.id,
    presetId: preset.id,
    messages: {
      create: [
        {
          role: 'USER',
          content: 'Hello!',
        },
        {
          role: 'ASSISTANT',
          content: 'Hi! How can I help you?',
        },
      ],
    },
  },
  include: {
    messages: true,
  },
});

// Get chat with all messages
const chatWithMessages = await prisma.chat.findUnique({
  where: { id: chatId },
  include: {
    messages: {
      orderBy: {
        createdAt: 'asc',
      },
    },
    preset: true,
  },
});
```

### Presets

```typescript
// Create preset
const preset = await prisma.preset.create({
  data: {
    name: 'Helpful Assistant',
    color: '#3B82F6',
    systemInstruction: 'You are a helpful assistant...',
    userId: user.id,
  },
});

// List user's presets
const presets = await prisma.preset.findMany({
  where: {
    userId: user.id,
  },
  orderBy: {
    createdAt: 'desc',
  },
});
```

### Cascade Deletes

The schema is configured with proper cascade deletes:

```typescript
// Deleting a user will automatically delete:
// - All their presets
// - All their chats
// - All messages in those chats
await prisma.user.delete({
  where: { id: userId },
});

// Deleting a chat will automatically delete:
// - All messages in that chat
await prisma.chat.delete({
  where: { id: chatId },
});

// Deleting a preset will:
// - Set presetId to null in related chats (SetNull)
await prisma.preset.delete({
  where: { id: presetId },
});
```

## Singleton Pattern

The Prisma Client uses a singleton pattern to prevent multiple instances:

```typescript
// packages/prisma/src/client.ts
export const prisma = global.prisma || new PrismaClient();
```

This ensures:
- ✅ Single connection pool
- ✅ Efficient resource usage
- ✅ Hot reload friendly in development
- ✅ No connection leaks

## Environment Variables

Required in `packages/prisma/.env` and `apps/backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/whalli?schema=public"
```

## Migration Workflow

### Development

```bash
# 1. Update schema.prisma
# 2. Generate client
pnpm db:generate

# 3. Push to dev database (quick iteration)
pnpm db:push

# OR create a migration (recommended)
pnpm db:migrate
```

### Production

```bash
# Deploy migrations only (no schema changes)
pnpm --filter @whalli/prisma migrate:deploy
```

## Type Safety

All Prisma types are automatically generated and exported:

```typescript
import type {
  User,
  Preset,
  Chat,
  Message,
  UserRole,
  MessageRole,
  Prisma,
} from '@whalli/prisma';

// Prisma input types
type CreateUserInput = Prisma.UserCreateInput;
type UpdateChatInput = Prisma.ChatUpdateInput;
type MessageWhereInput = Prisma.MessageWhereInput;
```

## Indexes

The schema includes indexes for optimal query performance:

- `userId` in Preset (for user's presets)
- `userId` in Chat (for user's chats)
- `presetId` in Chat (for preset's chats)
- `chatId` in Message (for chat's messages)

## Best Practices

1. **Always use the singleton** - Import `prisma` from this package
2. **Use transactions** - For multi-step operations
3. **Include relations wisely** - Only load what you need
4. **Use select/include** - Optimize queries
5. **Handle errors** - Prisma throws specific error types

## Troubleshooting

### "Cannot find module './generated/client'"
```bash
pnpm db:generate
```

### "Invalid `prisma.xxx.xxx()` invocation"
- Check DATABASE_URL is set correctly
- Ensure database is running
- Verify schema is pushed: `pnpm db:push`

### Schema drift detected
```bash
pnpm db:push --accept-data-loss  # Development only!
# OR
pnpm db:migrate                   # Create proper migration
```

---

**Remember**: This package is the ONLY place where database access happens. Keep it that way! 🔒
