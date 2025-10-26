# Whalli Monorepo - Setup Complete! 🎉

Your Turborepo monorepo is ready to use!

## ✅ What's Included

### 📦 Apps
1. **Backend (NestJS)** - `apps/backend`
   - Port: 4000
   - NestJS API server
   - Prisma integration (only consumer of Prisma client)
   - Example Users module
   - CORS configured for web & admin

2. **Web (Next.js)** - `apps/web`
   - Port: 3000
   - Next.js 14 with App Router
   - Public-facing application
   - Shared UI components

3. **Admin (Next.js)** - `apps/admin`
   - Port: 3001
   - Next.js 14 with App Router
   - Admin panel interface
   - Shared UI components

### 📚 Packages
1. **@whalli/prisma** - `packages/prisma`
   - Prisma schema
   - Generated Prisma Client
   - Database migrations
   - **ISOLATED**: Only backend should import this

2. **@whalli/utils** - `packages/utils`
   - Shared utilities
   - Zod schemas
   - Helper functions (cn, formatDate, etc.)
   - Type-safe utilities

3. **@whalli/ui** - `packages/ui`
   - Shared React components
   - Button, Card, Input components
   - Tailwind CSS styled
   - Lucide React icons

## 🚀 Next Steps

### 1. Set Up Database
```bash
# Copy environment files
cp packages/prisma/.env.example packages/prisma/.env
cp apps/backend/.env.example apps/backend/.env

# Update DATABASE_URL in both files with your PostgreSQL connection string
# Example: postgresql://user:password@localhost:5432/whalli?schema=public

# Generate Prisma Client
pnpm db:generate

# Push schema to database (for development)
pnpm db:push

# OR create a migration
pnpm db:migrate
```

### 2. Start Development
```bash
# Start all apps
pnpm dev

# Or start individually:
pnpm --filter @whalli/backend dev    # http://localhost:4000
pnpm --filter @whalli/web dev        # http://localhost:3000
pnpm --filter @whalli/admin dev      # http://localhost:3001
```

### 3. Verify Setup
- Backend: http://localhost:4000 (should show "Hello from Whalli Backend!")
- Backend Health: http://localhost:4000/health
- Web: http://localhost:3000 (should show welcome page)
- Admin: http://localhost:3001 (should show admin panel)

## 🛠️ Common Commands

```bash
# Development
pnpm dev                    # Run all apps
pnpm build                  # Build all apps
pnpm lint                   # Lint all packages
pnpm type-check            # Type check all packages

# Database
pnpm db:generate           # Generate Prisma Client
pnpm db:push              # Push schema to DB
pnpm db:migrate           # Create migration
pnpm db:studio            # Open Prisma Studio

# Individual apps
pnpm --filter @whalli/web build
pnpm --filter @whalli/backend dev
```

## 📁 Key Files

- `turbo.json` - Turborepo pipeline configuration
- `pnpm-workspace.yaml` - pnpm workspace configuration
- `tsconfig.json` - Root TypeScript configuration
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier configuration

## 🔒 Architecture Rules

1. **Backend is the ONLY consumer of Prisma Client**
   - Frontend apps must communicate via API
   - This enforces proper separation of concerns

2. **Shared code goes in packages**
   - UI components → `packages/ui`
   - Utilities & schemas → `packages/utils`
   - Never duplicate code between apps

3. **Type safety everywhere**
   - Strict TypeScript enabled
   - Zod for runtime validation
   - Proper tsconfig inheritance

## 📝 Environment Variables

### Backend (`apps/backend/.env`)
```env
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
DATABASE_URL="postgresql://user:password@localhost:5432/whalli?schema=public"
```

### Prisma (`packages/prisma/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/whalli?schema=public"
```

### Web & Admin (`apps/web/.env.local`, `apps/admin/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🎨 Technology Stack

**Backend:**
- NestJS 10
- Prisma 5
- PostgreSQL
- TypeScript 5

**Frontend:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS 3
- TypeScript 5

**Shared:**
- Turborepo 2
- pnpm workspaces
- Zod (validation)
- Lucide React (icons)
- ESLint + Prettier

## 🚢 Deployment Tips

1. **Backend**: Deploy to Railway, Heroku, Fly.io, or any Node.js host
2. **Web/Admin**: Deploy to Vercel or Netlify
3. **Database**: Use managed PostgreSQL (Supabase, Neon, Railway)

Remember to:
- Set environment variables
- Run `pnpm db:generate` in build step
- Run migrations before deployment

## 📚 Learn More

- [Turborepo Docs](https://turbo.build/repo/docs)
- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)

---

Happy coding! 🚀
