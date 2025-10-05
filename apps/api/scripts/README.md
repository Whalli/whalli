# API Scripts

Helper scripts for database setup and migrations.

## Available Scripts

### 🧪 test-chat-cache.sh
Test script to verify Redis cache system for chat responses.

**Usage:**
```bash
cd scripts
./test-chat-cache.sh
```

**Features:**
- Checks Redis connection
- Shows existing cache entries
- Tests cache set/get/delete operations
- Verifies TTL (Time To Live)
- Provides manual testing instructions
- Shows cache statistics

**Prerequisites:**
- Redis must be running (port 6379)
- redis-cli must be installed

**To start Redis:**
```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or using system Redis
redis-server
```

### 🗄️ setup-db.sh
Interactive script to configure PostgreSQL database for Whalli.

**Usage:**
```bash
cd scripts
./setup-db.sh
```

**Features:**
- Checks PostgreSQL installation and service status
- Helps configure database credentials
- Creates database and users
- Updates .env file automatically
- Tests database connection

**Options:**
1. Use existing PostgreSQL user 'postgres'
2. Create new PostgreSQL user for Whalli
3. Test existing connection from .env
4. Exit

### 🚀 quick-start.sh
Automated script to run migration and set up the subscriptionId extension.

**Usage:**
```bash
cd scripts
./quick-start.sh
```

**What it does:**
1. Checks Prisma Client is up to date
2. Tests database connection
3. Runs migration to add subscriptionId field
4. Shows migration status
5. Displays next steps

**Prerequisites:**
- Database must be configured (run `setup-db.sh` first)
- PostgreSQL must be running
- .env file must have valid DATABASE_URL

## Quick Setup Flow

### First Time Setup

```bash
# 1. Set up database
cd apps/api/scripts
./setup-db.sh

# 2. Run migration
./quick-start.sh

# 3. Start development server
cd ..
pnpm dev
```

### After Pulling Latest Changes

If someone else created a migration:

```bash
# Apply pending migrations
cd apps/api
npx prisma migrate dev

# Or use the quick-start script
cd scripts
./quick-start.sh
```

### Reset Database (Development Only!)

⚠️ **WARNING**: This will delete all data!

```bash
cd apps/api
npx prisma migrate reset
```

## Manual Commands

If you prefer to run commands manually:

### Create Migration
```bash
cd apps/api
npx prisma migrate dev --name your_migration_name
```

### Check Migration Status
```bash
cd apps/api
npx prisma migrate status
```

### Generate Prisma Client
```bash
cd apps/api
npx prisma generate
```

### View Database in Prisma Studio
```bash
cd apps/api
npx prisma studio
```

## Troubleshooting

### "Authentication failed" error

**Problem**: PostgreSQL credentials are incorrect

**Solution**: Run `./setup-db.sh` and choose option 1 or 2 to configure credentials

### "Migration already applied" warning

**Problem**: Migration was already run

**Solution**: This is normal. Check status with `npx prisma migrate status`

### "Database doesn't exist" error

**Problem**: Database 'whalli' hasn't been created

**Solution**: 
```bash
# Option 1: Use setup script
./setup-db.sh

# Option 2: Create manually
sudo -u postgres createdb whalli
```

### Script permission denied

**Problem**: Script is not executable

**Solution**:
```bash
chmod +x setup-db.sh
chmod +x quick-start.sh
```

## Documentation

- **Implementation Guide**: `../SUBSCRIPTION_ID_EXTENSION.md`
- **Quick Summary**: `../SUBSCRIPTION_ID_SUMMARY.md`
- **Prisma Docs**: https://www.prisma.io/docs

## Notes

- Always run scripts from the `apps/api/scripts` directory
- Scripts will automatically navigate to correct working directory
- Backup of .env is created as .env.backup before modifications
- Scripts are interactive and will prompt for necessary information
