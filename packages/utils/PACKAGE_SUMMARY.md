# @whalli/utils Package Summary

## 📦 Package Information
- **Name**: `@whalli/utils`
- **Version**: 0.0.0
- **Type**: Shared utility library
- **Dependencies**: `zod`, `clsx`, `tailwind-merge`

## 📁 File Structure

```
packages/utils/
├── src/
│   ├── index.ts          # Main exports + utility functions
│   ├── types.ts          # TypeScript types
│   ├── schemas.ts        # Zod validation schemas
│   ├── constants.ts      # Application constants
│   └── globals.d.ts      # Global type declarations
├── package.json
├── tsconfig.json
├── README.md
├── EXAMPLES.ts           # Usage examples
└── PACKAGE_SUMMARY.md    # This file
```

## 🎯 Purpose

Central package for shared code across the monorepo:
- **Type Safety**: Consistent TypeScript types
- **Validation**: Zod schemas for runtime checks
- **Constants**: Single source of truth for config
- **Utilities**: Helper functions used everywhere

## 📚 Exports

### Types (types.ts)
```typescript
UserSafe, Chat, Message, Preset, AIModel
Theme, Keybind, ApiResponse, PaginatedResponse
AuthTokens, AuthUser
```

### Schemas (schemas.ts)
```typescript
// Auth
loginSchema, registerSchema
changePasswordSchema, resetPasswordSchema

// Chat
createChatSchema, updateChatSchema
createMessageSchema, streamChatSchema

// Preset
createPresetSchema, updatePresetSchema

// Misc
paginationSchema, searchSchema
```

### Constants (constants.ts)
```typescript
// AI Models
AI_MODELS (15 models: GPT, Claude, Gemini)
getAIModel(id), getAIModelsByProvider(provider)

// Themes
THEMES, DEFAULT_THEME

// Colors
PRESET_COLORS (17 colors), DEFAULT_PRESET_COLOR

// Keybinds
KEYBINDS (12 shortcuts), getKeybind(id), formatKeybind(keys)

// Limits
RATE_LIMITS, MESSAGE_LIMITS, CHAT_LIMITS, PRESET_LIMITS
DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE

// Messages
ERROR_MESSAGES, SUCCESS_MESSAGES
```

### Utilities (index.ts)
```typescript
// Tailwind
cn(...classes)

// Dates
formatDate(date), formatRelativeTime(date)

// Strings
capitalize(str), truncate(str, max)

// Async
sleep(ms), debounce(fn, wait), throttle(fn, limit)

// Environment
isBrowser(), isServer()

// Misc
generateId(), safeJsonParse(json, fallback)
```

## 🔧 Usage in Apps

### Backend (NestJS)
```typescript
// Validate requests
import { loginSchema, ERROR_MESSAGES } from '@whalli/utils';

const result = loginSchema.safeParse(body);
if (!result.success) {
  throw new BadRequestException(ERROR_MESSAGES.INVALID_INPUT);
}
```

### Frontend (Next.js)
```typescript
// Forms with React Hook Form
import { registerSchema, type RegisterInput } from '@whalli/utils';

const form = useForm<RegisterInput>({
  resolver: zodResolver(registerSchema),
});
```

### UI Components
```typescript
// Consistent types
import { type Chat, formatRelativeTime, cn } from '@whalli/utils';

function ChatItem({ chat }: { chat: Chat }) {
  return (
    <div className={cn('p-4', isActive && 'bg-blue-50')}>
      <h3>{chat.title}</h3>
      <time>{formatRelativeTime(chat.createdAt)}</time>
    </div>
  );
}
```

## 🎨 AI Models Included

**OpenAI**: GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
**Anthropic**: Claude 3 Opus, Sonnet, Haiku
**Google**: Gemini Pro, Gemini Pro Vision

## 🎨 Preset Colors

17 colors from Tailwind palette:
Red, Orange, Amber, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Blue, Indigo, Violet, Purple, Fuchsia, Pink, Rose

## ⌨️ Keybinds

- `⌘K` / `Ctrl+K` - New Chat
- `⌘L` / `Ctrl+L` - Focus Input
- `⌘B` / `Ctrl+B` - Toggle Sidebar
- `⌘F` / `Ctrl+F` - Search Chats
- `Enter` - Send Message
- `⇧Enter` - New Line
- `Esc` - Stop Generation
- `⌘,` - Settings
- `⌘⇧T` - Toggle Theme
- `⌘R` - Regenerate
- And more...

## 📊 Validation Examples

```typescript
// Login validation
loginSchema.parse({
  email: "user@example.com",
  password: "secure123"
}); // ✅ Valid

// Chat creation
createChatSchema.parse({
  title: "My Chat",
  model: "gpt-4-turbo",
  presetId: "uuid-here" // optional
}); // ✅ Valid

// Preset with color
createPresetSchema.parse({
  name: "Helper",
  color: "#3B82F6", // must be hex
  systemInstruction: "You are helpful"
}); // ✅ Valid
```

## 🚫 What's NOT in Utils

- **Database Access**: Use `@whalli/prisma` (backend only)
- **UI Components**: Use `@whalli/ui`
- **API Calls**: Each app handles its own API client
- **Environment Variables**: Each app manages its own
- **Side Effects**: Utils are pure functions only

## ✅ Best Practices

1. **Import Types**: Use `type` keyword for type-only imports
2. **Validate Early**: Use schemas at API boundaries
3. **Consistent Constants**: Use provided constants, don't hardcode
4. **Tree Shaking**: Import only what you need
5. **Type Safety**: Let TypeScript catch errors

## 🔄 Adding New Items

### New Type
1. Add to `src/types.ts`
2. Export from `src/index.ts`
3. Update README examples

### New Schema
1. Add to `src/schemas.ts` with Zod
2. Export type with `z.infer<typeof schema>`
3. Test validation edge cases

### New Constant
1. Add to `src/constants.ts`
2. Add helper function if needed
3. Document in README

### New Utility
1. Add to `src/index.ts`
2. Add JSDoc comment
3. Keep it pure (no side effects)

## 📦 Dependencies

- **zod**: ^3.22.4 - Runtime validation
- **clsx**: Latest - Conditional classes
- **tailwind-merge**: Latest - Merge Tailwind classes

## 🎯 Design Goals

✅ **Type Safety**: Full TypeScript coverage
✅ **Runtime Safety**: Zod validation at boundaries
✅ **DRY**: Single source of truth
✅ **Pure**: No side effects or I/O
✅ **Documented**: JSDoc on everything
✅ **Tested**: Can add tests easily
✅ **Minimal**: Only essential utilities

## 📈 Package Size

Approximate bundle sizes:
- Types: 0 KB (compile-time only)
- Schemas: ~5 KB (zod + schemas)
- Constants: ~2 KB (static data)
- Utilities: ~1 KB (small helpers)

Total: ~8 KB (before tree shaking)

## 🔗 Related Documentation

- [Main README](./README.md) - Detailed usage guide
- [Examples](./EXAMPLES.ts) - Code examples
- [Prisma Package](../prisma/README.md) - Database types
- [UI Package](../ui/README.md) - React components
