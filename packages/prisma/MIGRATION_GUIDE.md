# Prisma Migration Guide

## Quick Setup

### 1. Ensure Database is Running

```bash
# If using Docker:
docker run --name whalli-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=whalli \
  -p 5432:5432 \
  -d postgres

# Or use your existing PostgreSQL instance
```

### 2. Configure Environment

```bash
# Copy example files
cp packages/prisma/.env.example packages/prisma/.env
cp apps/backend/.env.example apps/backend/.env

# Update DATABASE_URL in both files:
DATABASE_URL="postgresql://postgres:password@localhost:5432/whalli?schema=public"
```

### 3. Generate Prisma Client

```bash
pnpm db:generate
```

### 4. Push Schema to Database

```bash
# Option A: Quick push (development)
pnpm db:push

# Option B: Create migration (recommended)
pnpm db:migrate
# Enter migration name when prompted (e.g., "init")
```

### 5. (Optional) Seed Database

```bash
pnpm --filter @whalli/prisma db:seed
```

## Verify Setup

### Check Prisma Studio

```bash
pnpm db:studio
```

Visit http://localhost:5555 to see your database visually.

### Test Backend Connection

```bash
# Start backend
pnpm --filter @whalli/backend dev

# In another terminal, test endpoint
curl http://localhost:4000/users
```

## Schema Changes Workflow

### Making Changes

1. **Edit** `packages/prisma/schema.prisma`
2. **Generate** client: `pnpm db:generate`
3. **Push** or **migrate**:
   - Dev: `pnpm db:push`
   - Prod: `pnpm db:migrate`

### Example: Adding a Field

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      UserRole @default(USER)
  // Add new field:
  avatar    String?  // Profile picture URL
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  presets Preset[]
  chats   Chat[]

  @@map("users")
}
```

Then:
```bash
pnpm db:generate
pnpm db:push
```

## Common Commands

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema (no migration file)
pnpm db:push

# Create and apply migration
pnpm db:migrate

# Prisma Studio
pnpm db:studio

# Reset database (⚠️ deletes all data!)
pnpm --filter @whalli/prisma prisma migrate reset

# Check migration status
pnpm --filter @whalli/prisma prisma migrate status

# Deploy migrations (production)
pnpm --filter @whalli/prisma prisma migrate deploy
```

## Troubleshooting

### "Module not found" errors

```bash
# Regenerate client
rm -rf packages/prisma/generated
pnpm db:generate
```

### Database connection errors

```bash
# Test connection
psql "postgresql://postgres:password@localhost:5432/whalli"

# Check if PostgreSQL is running
docker ps  # if using Docker
```

### Schema drift detected

```bash
# Development: Force push
pnpm --filter @whalli/prisma prisma db:push --accept-data-loss

# Production: Create proper migration
pnpm db:migrate
```

## Production Deployment

### Before Deployment

1. Ensure all migrations are created and committed
2. Test migrations in staging environment
3. Backup production database

### Deploy Steps

```bash
# 1. Deploy migrations only (no schema changes)
DATABASE_URL="<prod-url>" pnpm --filter @whalli/prisma prisma migrate deploy

# 2. Generate client
pnpm db:generate

# 3. Build and deploy apps
pnpm build
```

### Environment Variables

Set in production:
```env
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public"
NODE_ENV=production
```

## Migration History

Migrations are stored in `packages/prisma/migrations/`.

Each migration:
- Has a timestamp and name
- Contains SQL for up migration
- Is tracked in `_prisma_migrations` table

**Never edit existing migrations!** Create new ones instead.

---

**You're all set!** 🎉 Your database is ready to use.
