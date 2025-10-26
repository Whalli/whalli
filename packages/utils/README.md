# @whalli/utils

Shared utilities, types, schemas, and constants for the Whalli monorepo.

## 📦 What's Included

### Types (`types.ts`)
TypeScript types that match the Prisma schema but are safe for client-side use:
- `UserSafe` - User without password
- `Chat` - Chat conversation
- `Message` - Chat message
- `Preset` - AI behavior preset
- `AIModel` - AI model configuration
- `Theme` - Theme configuration
- `Keybind` - Keyboard shortcut
- API response types (`ApiResponse`, `PaginatedResponse`)

### Schemas (`schemas.ts`)
Zod validation schemas for runtime validation:

**Auth**
- `loginSchema` - Email + password login
- `registerSchema` - User registration
- `changePasswordSchema` - Password change
- `resetPasswordSchema` - Password reset

**Chat**
- `createChatSchema` - Create new chat
- `updateChatSchema` - Update chat details
- `createMessageSchema` - Send message
- `streamChatSchema` - Stream chat response

**Preset**
- `createPresetSchema` - Create AI preset
- `updatePresetSchema` - Update preset

**Misc**
- `paginationSchema` - Pagination params
- `searchSchema` - Search with pagination

### Constants (`constants.ts`)
Application-wide constants:

**AI Models**
- `AI_MODELS` - Available AI models (GPT-4, Claude, Gemini, etc.)
- `getAIModel(id)` - Get model by ID
- `getAIModelsByProvider(provider)` - Filter by provider

**Themes**
- `THEMES` - Available themes (light, dark, system)
- `DEFAULT_THEME` - Default theme

**Colors**
- `PRESET_COLORS` - Preset color palette (17 colors)
- `DEFAULT_PRESET_COLOR` - Default color

**Keybinds**
- `KEYBINDS` - Application keyboard shortcuts
- `getKeybind(id)` - Get keybind by ID
- `formatKeybind(keys)` - Format for display

**Limits**
- `RATE_LIMITS` - API rate limits
- `MESSAGE_LIMITS` - Message constraints
- `CHAT_LIMITS` - Chat constraints
- `PRESET_LIMITS` - Preset constraints

**Messages**
- `ERROR_MESSAGES` - Standard error messages
- `SUCCESS_MESSAGES` - Standard success messages

### Utility Functions (`index.ts`)
Common helper functions:
- `cn()` - Merge Tailwind classes
- `formatDate()` - Format date to string
- `formatRelativeTime()` - Relative time (e.g., "2 hours ago")
- `capitalize()` - Capitalize first letter
- `truncate()` - Truncate string
- `generateId()` - Generate random ID
- `debounce()` - Debounce function calls
- `throttle()` - Throttle function calls
- `isBrowser()` - Check if running in browser
- `isServer()` - Check if running on server
- `safeJsonParse()` - Safe JSON parse with fallback

## 🚀 Usage

### In Backend (NestJS)

```typescript
import { 
  loginSchema, 
  createChatSchema,
  UserSafe,
  ERROR_MESSAGES 
} from '@whalli/utils';

// Validate input
const result = loginSchema.safeParse(body);
if (!result.success) {
  throw new BadRequestException(ERROR_MESSAGES.INVALID_INPUT);
}

// Use types
const user: UserSafe = {
  id: '...',
  email: 'user@example.com',
  name: 'John Doe',
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### In Frontend (Next.js)

```typescript
import { 
  AI_MODELS,
  PRESET_COLORS,
  formatRelativeTime,
  cn,
  type Chat,
  type Message
} from '@whalli/utils';

// Use AI models
const models = AI_MODELS.map(m => ({
  value: m.id,
  label: m.label
}));

// Format dates
const timeAgo = formatRelativeTime(chat.createdAt);

// Merge classes
const className = cn(
  'base-class',
  isActive && 'active-class'
);
```

### Form Validation

```typescript
import { registerSchema, type RegisterInput } from '@whalli/utils';

const form = useForm<RegisterInput>({
  resolver: zodResolver(registerSchema),
});
```

### API Responses

```typescript
import { type ApiResponse, type PaginatedResponse } from '@whalli/utils';

// Single item response
const response: ApiResponse<Chat> = {
  success: true,
  data: chat,
};

// Paginated response
const paginatedChats: PaginatedResponse<Chat> = {
  data: chats,
  total: 100,
  page: 1,
  pageSize: 20,
  hasMore: true,
};
```

## 📋 Design Principles

1. **No Side Effects** - Pure functions only, no I/O or network calls
2. **Type Safety** - Full TypeScript support with strict types
3. **Runtime Validation** - Zod schemas for runtime safety
4. **Tree Shakeable** - Import only what you need
5. **Framework Agnostic** - Works with any JS framework
6. **Well Documented** - Clear JSDoc comments

## 🔧 Development

```bash
# In this package directory
pnpm install

# Run type checking
pnpm tsc --noEmit
```

## 📚 Related Packages

- `@whalli/prisma` - Database client (backend only)
- `@whalli/ui` - Shared React components
