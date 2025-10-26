# Whalli Development Cheatsheet

Quick reference for common development tasks.

## 🚀 Starting Development

```bash
# Start everything
pnpm dev

# Start specific app
pnpm --filter @whalli/backend dev
pnpm --filter @whalli/web dev
pnpm --filter @whalli/admin dev
```

## 🔧 Building

```bash
# Build everything
pnpm build

# Build specific app
pnpm --filter @whalli/backend build
pnpm --filter @whalli/web build
pnpm --filter @whalli/admin build
```

## 🗄️ Database Commands

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema changes (dev)
pnpm db:push

# Create migration
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio

# Reset database (⚠️ dangerous!)
pnpm --filter @whalli/prisma prisma migrate reset
```

## 📦 Package Management

```bash
# Add root dependency
pnpm add -w <package>

# Add to specific workspace
pnpm add <package> --filter @whalli/web

# Add dev dependency
pnpm add -D <package> --filter @whalli/backend

# Remove dependency
pnpm remove <package> --filter @whalli/utils

# Update all dependencies
pnpm update -r

# Update specific package
pnpm update <package> --filter @whalli/web
```

## 🧹 Cleaning

```bash
# Clean all build artifacts
pnpm clean

# Clean and reinstall
pnpm clean && rm -rf node_modules pnpm-lock.yaml && pnpm install

# Clean specific app
pnpm --filter @whalli/web clean
```

## ✨ Linting & Formatting

```bash
# Lint everything
pnpm lint

# Fix linting issues
pnpm --filter @whalli/web lint --fix

# Format code
pnpm format

# Check formatting
pnpm format:check

# Type check
pnpm type-check
```

## 🎯 Turborepo

```bash
# Run task across all workspaces
turbo run build

# Run with force (ignore cache)
turbo run build --force

# Run with verbosity
turbo run build --verbose

# Clear Turbo cache
turbo run build --no-cache

# View task graph
turbo run build --graph
```

## 🔍 Useful pnpm Commands

```bash
# List all workspace packages
pnpm list -r --depth 0

# Check outdated packages
pnpm outdated -r

# Why is package installed?
pnpm why <package>

# List scripts
pnpm run

# Run script in all workspaces
pnpm -r run <script>
```

## 🌐 Port Reference

| App | Port | URL |
|-----|------|-----|
| Backend | 4000 | http://localhost:4000 |
| Web | 3000 | http://localhost:3000 |
| Admin | 3001 | http://localhost:3001 |

## 📂 Key Directories

```
whalli/
├── apps/
│   ├── backend/      # NestJS API (port 4000)
│   ├── web/          # Next.js web (port 3000)
│   └── admin/        # Next.js admin (port 3001)
├── packages/
│   ├── prisma/       # Database schema & client
│   ├── utils/        # Shared utilities
│   └── ui/           # Shared components
└── node_modules/     # Dependencies
```

## 🔑 Environment Files

```bash
# Backend
apps/backend/.env

# Prisma
packages/prisma/.env

# Web
apps/web/.env.local

# Admin
apps/admin/.env.local
```

## 🐛 Debugging

### Backend (NestJS)
```bash
# Debug mode
pnpm --filter @whalli/backend start:debug

# Then attach debugger to port 9229
```

### Next.js
```bash
# Built-in debugging
NODE_OPTIONS='--inspect' pnpm --filter @whalli/web dev
```

## 📊 Database Workflow

### Development
```bash
# 1. Update schema.prisma
# 2. Generate client
pnpm db:generate

# 3. Push to database (quick iteration)
pnpm db:push

# OR create migration (version control)
pnpm db:migrate
```

### Production
```bash
# 1. Run migrations
pnpm --filter @whalli/prisma prisma migrate deploy

# 2. Generate client
pnpm db:generate
```

## 🎨 Adding UI Components

```bash
# 1. Create component in packages/ui/src/
# 2. Export from packages/ui/src/index.tsx
# 3. Use in apps:

# apps/web/app/page.tsx
import { NewComponent } from '@whalli/ui';
```

## 🔨 Common Tasks

### Add New API Endpoint (Backend)
```bash
# 1. Generate module
cd apps/backend
nest g module posts
nest g controller posts
nest g service posts

# 2. Update module imports
# 3. Implement logic
```

### Add New Page (Next.js)
```bash
# App Router structure:
apps/web/app/
├── page.tsx          # /
├── about/
│   └── page.tsx      # /about
└── blog/
    ├── page.tsx      # /blog
    └── [slug]/
        └── page.tsx  # /blog/:slug
```

### Add Prisma Model
```prisma
// packages/prisma/schema.prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}
```

```bash
# Then:
pnpm db:generate
pnpm db:push  # or pnpm db:migrate
```

## 🚨 Troubleshooting

### "Module not found"
```bash
# Regenerate Prisma Client
pnpm db:generate

# Clear cache and reinstall
rm -rf node_modules .next .turbo
pnpm install
```

### "Port already in use"
```bash
# Find process on port
lsof -ti:4000

# Kill process
kill -9 $(lsof -ti:4000)
```

### Type errors after dependency update
```bash
# Clear TypeScript cache
rm -rf apps/*/tsconfig.tsbuildinfo
pnpm type-check
```

### Prisma Client out of sync
```bash
# Regenerate
pnpm db:generate

# If still issues, clear and regenerate
rm -rf packages/prisma/generated
pnpm db:generate
```

## 📝 Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-feature
```

## 🔗 Useful Links

- [Turborepo Docs](https://turbo.build/repo/docs)
- [pnpm Docs](https://pnpm.io/)
- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Pro Tip**: Bookmark this file! Keep it open in a separate tab while developing.
