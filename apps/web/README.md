# Whalli Web App

Next.js 14 App Router application with dark, minimal, fluid design.

## Features

### 🎨 Design System
- **Dark Theme**: Zinc-950 background with fluid animations
- **Dual Sidebar Layout**:
  - Primary Sidebar (left): Global navigation, collapsible
  - Context Sidebar (right): Page-scoped panel, auto-hides
- **All Icons**: Lucide React
- **Components**: Shared from `@whalli/ui` package

### 🔐 Authentication
- JWT-based authentication
- Login & registration pages
- Protected routes with auth context
- Persistent sessions (localStorage)

### 📱 Pages

#### `/chat` - Chat Management
- List all user's chats
- Create new chats
- Real-time AI conversations
- Message history

#### `/chat/[id]` - Chat Detail
- View conversation messages
- Send messages with AI responses
- User/Assistant message differentiation
- Auto-scroll to latest message

#### `/projects` - Projects (Stub)
- Coming soon: Organize work into projects

#### `/mindmaps` - Mindmaps (Stub)
- Coming soon: Visual knowledge graphs

#### `/presets` - AI Presets
- Create/manage AI presets
- Custom system instructions
- Color-coded organization
- Use presets in chats

#### `/settings` - User Settings
- Profile information
- Account preferences
- Coming soon: Full settings

### 🔌 API Client Layer

Type-safe API client (`lib/api-client.ts`):
- Uses `NEXT_PUBLIC_API_URL` environment variable
- JWT token management
- Full TypeScript types from `@whalli/utils`
- **NO direct Prisma usage**

#### API Methods

**Authentication:**
```typescript
api.register({ email, password, name })
api.login({ email, password })
api.logout()
api.getMe()
api.refreshToken(token)
```

**Chats:**
```typescript
api.getChats()
api.getChat(id)
api.createChat({ title, model, presetId? })
api.updateChat(id, { title?, model? })
api.deleteChat(id)
```

**Messages:**
```typescript
api.getMessages(chatId)
api.sendMessage(chatId, { content })
```

**Presets:**
```typescript
api.getPresets()
api.getPreset(id)
api.createPreset({ name, color, systemInstruction })
api.updatePreset(id, { name?, color?, systemInstruction? })
api.deletePreset(id)
```

## Setup

### 1. Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Development Server

```bash
pnpm dev
```

The app runs on [http://localhost:3000](http://localhost:3000)

## Project Structure

```
apps/web/
├── app/
│   ├── (auth)/
│   │   └── login/          # Authentication page
│   ├── (app)/              # Protected routes with AppShell
│   │   ├── chat/
│   │   │   ├── [id]/       # Individual chat page
│   │   │   ├── layout.tsx  # Chat layout with AppShell
│   │   │   └── page.tsx    # Chat list page
│   │   ├── projects/       # Projects page (stub)
│   │   ├── mindmaps/       # Mindmaps page (stub)
│   │   ├── presets/        # Presets management
│   │   └── settings/       # User settings
│   ├── layout.tsx          # Root layout with AuthProvider
│   ├── page.tsx            # Home (redirects to /chat or /login)
│   └── globals.css         # Global styles (dark theme)
├── components/
│   └── app-shell.tsx       # Dual sidebar layout
├── contexts/
│   └── auth-context.tsx    # Authentication state management
├── lib/
│   └── api-client.ts       # Type-safe API client
└── package.json
```

## Architecture Decisions

### Why No Direct Prisma?
- **Separation of Concerns**: Frontend consumes REST API only
- **Type Safety**: Types imported from `@whalli/utils` package
- **Backend as Single Source of Truth**: All data logic in NestJS backend
- **Easier Testing**: Can mock API responses
- **Deployment Flexibility**: Frontend can be deployed separately

### Why Dual Sidebar Layout?
- **Primary Sidebar**: Always-accessible global navigation
- **Context Sidebar**: Page-specific tools/info without cluttering main content
- **Responsive**: Both sidebars collapsible on small screens
- **Keyboard Accessible**: Toggle with shortcuts

### Why App Router?
- **Server Components**: Better performance
- **Nested Layouts**: Shared layouts with `layout.tsx`
- **File-based Routing**: Clear project structure
- **Modern React**: Latest features and patterns

## Key Components

### AppShell
Main layout component with dual sidebars:
```tsx
<AppShell contextSidebar={<div>Optional context panel</div>}>
  <YourPageContent />
</AppShell>
```

### AuthProvider
Wraps entire app to provide auth state:
```tsx
const { user, loading, login, register, logout, isAuthenticated } = useAuth();
```

### API Client
Singleton instance for all API calls:
```tsx
import { api } from '@/lib/api-client';

const chats = await api.getChats();
await api.sendMessage(chatId, { content: 'Hello!' });
```

## Styling

### Tailwind Classes
- Background: `bg-zinc-950`, `bg-zinc-900`, `bg-zinc-800`
- Text: `text-zinc-100`, `text-zinc-400`, `text-zinc-500`
- Borders: `border-zinc-800`, `border-zinc-700`
- Accents: `bg-blue-600`, `text-blue-400`

### Custom Scrollbar
Dark, minimal scrollbar with smooth hover effect.

### Responsive Design
- Mobile-first approach
- Collapsible sidebars on small screens
- Fluid typography and spacing

## Development

### Type Safety
All API responses typed with interfaces from `@whalli/utils`:
```typescript
import type { Chat, Message, Preset, UserSafe } from '@whalli/utils';
```

### Error Handling
API client throws `ApiError` with:
- `message`: Human-readable error
- `statusCode`: HTTP status code
- `error`: Optional error type

### Loading States
All pages show loading spinners while fetching data.

### Optimistic Updates
Some actions (like sending messages) update UI before API responds.

## Testing

### Manual Testing Checklist
- [ ] Register new account
- [ ] Login with credentials
- [ ] Create new chat
- [ ] Send message and receive AI response
- [ ] View chat history
- [ ] Create preset
- [ ] Delete preset
- [ ] Logout
- [ ] Navigate between pages
- [ ] Toggle sidebars
- [ ] Responsive design (mobile)

### Backend Required
The app requires the NestJS backend running on port 3001:
```bash
cd apps/backend
pnpm dev
```

## Next Steps

### Planned Features
- [ ] Streaming AI responses (SSE)
- [ ] Message editing/regeneration
- [ ] Chat search and filtering
- [ ] Preset templates
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts panel
- [ ] Projects implementation
- [ ] Mindmaps implementation
- [ ] Advanced settings
- [ ] User avatars upload
- [ ] Export conversations
- [ ] Markdown rendering in messages
- [ ] Code syntax highlighting

### Performance Optimizations
- [ ] Virtual scrolling for long conversations
- [ ] Image lazy loading
- [ ] Route prefetching
- [ ] API request caching
- [ ] Debounced search inputs

## Deployment

### Build for Production
```bash
pnpm build
```

### Environment Variables
Set `NEXT_PUBLIC_API_URL` to your production backend URL.

### Hosting Options
- **Vercel**: Native Next.js support
- **Netlify**: Works with App Router
- **Docker**: Containerize with `node:20-alpine`
- **Static Export**: Not supported (uses dynamic features)

## Troubleshooting

### "Cannot find module '@/...'"
- Check `tsconfig.json` has `"@/*": ["./*"]` in paths
- Restart TypeScript server: Cmd+Shift+P → "TypeScript: Restart TS Server"

### API Requests Failing
- Check backend is running on port 3001
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors
- Ensure JWT token is valid (check localStorage)

### Sidebar Not Showing
- Ensure page is wrapped in `<AppShell>` component
- Check browser console for errors
- Verify AuthProvider wraps entire app

### Auth Not Persisting
- Check localStorage in browser DevTools
- Ensure token is being set after login
- Verify token is sent in Authorization header

## Contributing

### Code Style
- Use TypeScript strict mode
- Follow existing component patterns
- Use Tailwind classes (no inline styles)
- Add JSDoc comments to functions
- Use descriptive variable names

### Component Guidelines
- Mark client components with `'use client'`
- Export default function components
- Use named imports for icons
- Keep components focused and small
- Extract reusable logic to hooks

## License

MIT
