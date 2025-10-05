# Whalli Web App

Next.js 14 web application with Better-Auth authentication and Deep Ocean design system.

## 🎨 NEW: Deep Ocean Theme UI + Dual Sidebar System

**Complete UI refactor with modern design system and dual sidebar architecture!**

The web app now features:
- **Primary Color**: #040069 (deep blue)
- **Typography**: Zain font (logo/headings), Inter (body)
- **6 Complete Pages**: Home, Chat, Tasks, Projects, Profile, Settings
- **Dual Sidebar System**: 
  - Primary navigation sidebar (80px, always visible)
  - Secondary contextual sidebar (256px, dynamic per page)
- **Responsive Design**: Mobile-first with sidebar navigation
- **Smooth Animations**: Professional transitions and interactions

📖 **Documentation**:
- [UI Refactor Guide](./UI_REFACTOR.md) - Complete 500+ line guide
- [Dual Sidebar System](./DUAL_SIDEBAR_SYSTEM.md) - Detailed architecture guide
- [Dual Sidebar Summary](./DUAL_SIDEBAR_SUMMARY.md) - Quick reference
- [Quick Summary](./UI_REFACTOR_SUMMARY.md) - UI quick reference
- [Visual Overview](./UI_VISUAL_OVERVIEW.md) - Visual documentation
- [Phase 2 Checklist](./PHASE_2_CHECKLIST.md) - Next steps
- [Executive Summary](./EXECUTIVE_SUMMARY.md) - Complete overview (French)

🚀 **Quick Start**: Navigate to any page to see the new design:
- Home: http://localhost:3000
- Chat: http://localhost:3000/chat
- Tasks: http://localhost:3000/tasks
- Projects: http://localhost:3000/projects
- Profile: http://localhost:3000/profile
- Settings: http://localhost:3000/settings

## Features

- ✅ **Authentication System** - Better-Auth with multiple providers:
  - Email & Password (with magic links support)
  - Google OAuth
  - Session management with Redis (optional)
  
- ✅ **Protected Routes** - Middleware-based route protection for `/dashboard`
- ✅ **Beautiful UI** - Tailwind CSS + Radix UI components
- ✅ **Type Safety** - Full TypeScript support with shared types
- ✅ **Prisma Integration** - Direct database access with Prisma Client

## Getting Started

### 1. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update the following required variables:

```env
# Generate a secure secret with: openssl rand -base64 32
NEXTAUTH_SECRET=your-secret-here

# Database (same as API)
DATABASE_URL=postgresql://postgres:password@localhost:5432/whalli

# For Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. Setup Database

The web app uses the API's Prisma schema. First, generate the Prisma client:

```bash
# From the monorepo root
pnpm --filter=@whalli/api prisma generate
```

Then run migrations:

```bash
pnpm --filter=@whalli/api prisma db push
```

### 3. Install Dependencies

```bash
# From the monorepo root
pnpm install
```

### 4. Run Development Server

```bash
# From the monorepo root
pnpm --filter=@whalli/web dev

# Or run all apps
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication Setup

### Email & Password Authentication

Already configured! Users can:
- Sign up at `/signup`
- Sign in at `/login`
- Access protected routes after authentication

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy the Client ID and Client Secret to your `.env.local`

### Redis Session Storage (Optional)

By default, sessions are stored in PostgreSQL. To use Redis:

1. Start Redis:
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

2. Add to `.env.local`:
```env
REDIS_URL=redis://localhost:6379
```

3. Uncomment the Redis plugin in `src/lib/auth-server.ts`

## Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── api/auth/[...all]/    # Better-Auth API routes
│   │   ├── login/                # Login page
│   │   ├── signup/               # Signup page
│   │   ├── dashboard/            # Protected dashboard
│   │   └── page.tsx              # Home page
│   ├── lib/
│   │   ├── auth-server.ts        # Better-Auth server config
│   │   └── auth-client.ts        # Better-Auth client hooks
│   └── middleware.ts             # Route protection middleware
├── .env.example                  # Environment template
└── package.json
```

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server (port 3000)

# Building
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript compiler
```

## Authentication Flow

### Sign Up
1. User fills signup form at `/signup`
2. Better-Auth creates user in database
3. Session is created automatically
4. User is redirected to `/dashboard`

### Sign In
1. User enters credentials at `/login`
2. Better-Auth validates credentials
3. Session is created on success
4. User is redirected to original destination or `/dashboard`

### Protected Routes
1. User tries to access `/dashboard/*`
2. Middleware checks for valid session
3. If no session: redirect to `/login` with callback URL
4. If valid session: allow access

### Sign Out
1. User clicks "Sign Out" button
2. Better-Auth invalidates session
3. User is redirected to `/login`

## Technologies

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Better-Auth 0.5+
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI (@whalli/ui)
- **Type Safety**: TypeScript + Zod
- **Session Store**: PostgreSQL (optional: Redis)

## Troubleshooting

### "Cannot find module '@/lib/auth-server'"

Make sure the path alias is configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### "Prisma Client is not generated"

Run from the monorepo root:

```bash
pnpm --filter=@whalli/api prisma generate
```

### Google OAuth redirect error

Make sure your redirect URI in Google Console matches exactly:
```
http://localhost:3000/api/auth/callback/google
```

For production, add:
```
https://yourdomain.com/api/auth/callback/google
```

### Database connection error

1. Check if PostgreSQL is running
2. Verify DATABASE_URL in `.env.local`
3. Make sure migrations are applied

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Better-Auth Documentation](https://better-auth.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
