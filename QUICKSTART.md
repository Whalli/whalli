# 🚀 Quick Start Guide

Get your Whalli monorepo running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js version (need >= 18)
node --version

# Check if pnpm is installed
pnpm --version

# If pnpm is not installed:
npm install -g pnpm
```

## Step 1: Set Up Database Connection (2 minutes)

```bash
# Copy environment files
cp packages/prisma/.env.example packages/prisma/.env
cp apps/backend/.env.example apps/backend/.env

# Edit both files and update DATABASE_URL
# Example: postgresql://user:password@localhost:5432/whalli?schema=public
```

**Quick PostgreSQL Setup (if needed):**

```bash
# Using Docker
docker run --name whalli-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=whalli -p 5432:5432 -d postgres

# Then use this DATABASE_URL:
# postgresql://postgres:password@localhost:5432/whalli?schema=public
```

## Step 2: Generate Prisma Client (30 seconds)

```bash
pnpm db:generate
```

## Step 3: Set Up Database Schema (30 seconds)

```bash
# For quick development (no migrations):
pnpm db:push

# OR for production-ready setup:
pnpm db:migrate
```

## Step 4: Start Development (1 minute)

```bash
# Start all apps simultaneously
pnpm dev
```

Wait for all apps to start, then open:

- 🌐 **Web**: http://localhost:3000
- 🔐 **Admin**: http://localhost:3001
- 🔌 **Backend**: http://localhost:4000

## Verify Setup

### Test Backend
```bash
# Health check
curl http://localhost:4000/health

# Get users (empty array initially)
curl http://localhost:4000/users

# Create a user
curl -X POST http://localhost:4000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

### Test Frontend
- Visit http://localhost:3000 - Should see welcome page with UI components
- Visit http://localhost:3001 - Should see admin panel

## Common Issues & Solutions

### Port Already in Use
```bash
# Find and kill process on port
lsof -ti:4000 | xargs kill -9
```

### Prisma Client Not Found
```bash
# Regenerate Prisma Client
pnpm db:generate
```

### Type Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next .turbo
pnpm install
```

### Database Connection Error
- Check DATABASE_URL is correct in both `.env` files
- Ensure PostgreSQL is running
- Test connection: `psql <your-database-url>`

## What's Next?

### Explore the Code
1. Check `apps/backend/src/users` for example API
2. Look at `packages/ui/src` for shared components
3. Review `apps/web/app/page.tsx` for frontend example

### Add Your First Feature

**Backend:**
```bash
cd apps/backend
npx nest g module posts
npx nest g controller posts
npx nest g service posts
```

**Frontend:**
```bash
# Create new page in apps/web/app/about/page.tsx
mkdir -p apps/web/app/about
touch apps/web/app/about/page.tsx
```

**UI Component:**
```bash
# Add component in packages/ui/src/
touch packages/ui/src/badge.tsx
```

### Open Prisma Studio
```bash
pnpm db:studio
```
Opens at http://localhost:5555 - Visual database browser

## Useful Commands

```bash
# Run specific app
pnpm --filter @whalli/backend dev
pnpm --filter @whalli/web dev
pnpm --filter @whalli/admin dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

## Environment Variables Reference

### Backend (`apps/backend/.env`)
```env
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
DATABASE_URL="postgresql://user:password@localhost:5432/whalli"
```

### Prisma (`packages/prisma/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/whalli"
```

### Web/Admin (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Next Steps

1. ✅ Read `README.md` for full documentation
2. ✅ Check `ARCHITECTURE.md` for system design
3. ✅ Review `CHEATSHEET.md` for commands
4. ✅ See `CONTRIBUTING.md` before making changes

## Getting Help

- 📚 Documentation is in the root folder
- 🐛 Check existing issues before creating new ones
- 💬 Ask in discussions
- 📧 Contact maintainers

---

**You're ready to build! 🎉**

Happy coding! Start by exploring the example code in `apps/backend/src/users` and `apps/web/app/page.tsx`.
