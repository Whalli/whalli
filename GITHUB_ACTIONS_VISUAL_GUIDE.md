# GitHub Actions Deployment - Visual Guide

Visual diagrams and flowcharts for the GitHub Actions deployment workflow with Prisma migrations.

## 📊 Deployment Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Repository                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   main.ts    │  │ schema.prisma│  │   /migrations/*      │ │
│  │  (NestJS)    │  │   (Prisma)   │  │  (SQL migrations)    │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ git push origin main
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflow                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Checkout code                                        │  │
│  │  2. Setup SSH (ssh-agent + private key)                  │  │
│  │  3. SSH to production server                             │  │
│  │  4. Pull latest code (git reset --hard origin/main)      │  │
│  │  5. Create .env with 18 secrets                          │  │
│  │  6. Build Docker images (docker-compose build)           │  │
│  │  7. Start services (docker-compose up -d)                │  │
│  │  8. Wait 30 seconds                                      │  │
│  │  9. ⭐ Run Prisma migrations (NEW)                        │  │
│  │ 10. Verify health checks                                 │  │
│  │ 11. Rollback on failure                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ SSH connection
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Production Server                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Docker Compose (9 Services)                  │ │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│ │
│  │  │ Web │ │ API │ │Admin│ │Redis│ │MinIO│ │Prome│ │Graf ││ │
│  │  │3000 │ │3001 │ │3002 │ │6379 │ │9000 │ │9090 │ │3000 ││ │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘│ │
│  │        ▲                                                   │ │
│  │        │ DATABASE_URL (from GitHub secret)                │ │
│  │        │                                                   │ │
│  │  ┌─────┴──────────────────────────────────────────────┐  │ │
│  │  │  Prisma Migration:                                  │  │ │
│  │  │  docker-compose exec -T api                         │  │ │
│  │  │    npx prisma migrate deploy                        │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Connection string with SSL
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Neon Postgres                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Database: whalli_production                             │ │
│  │  Region: us-east-2                                       │ │
│  │  SSL: Required (?sslmode=require)                        │ │
│  │                                                           │ │
│  │  Tables: User, Message, Project, Task, etc.              │ │
│  │  _prisma_migrations (migration tracking)                 │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Deployment Flow (Step-by-Step)

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Developer pushes code                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: GitHub Actions triggered                               │
│   Trigger: push to main OR manual workflow_dispatch            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Checkout code                                          │
│   actions/checkout@v4                                           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Setup SSH                                              │
│   Load SSH_PRIVATE_KEY from GitHub secrets                     │
│   Start ssh-agent                                               │
│   Add server to known_hosts                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: SSH to server                                          │
│   ssh $SERVER_USER@$SERVER_HOST                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Pull latest code                                       │
│   cd /opt/whalli                                                │
│   git fetch origin main                                         │
│   git reset --hard origin/main                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Create .env file                                       │
│   Load 18 secrets from GitHub Actions                          │
│   Write to /opt/whalli/.env                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Build Docker images                                    │
│   docker-compose -f docker-compose.prod.yml build --no-cache   │
│   Duration: ~5 minutes                                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 9: Start services                                         │
│   docker-compose -f docker-compose.prod.yml up -d               │
│   Services: web, api, admin, workers, redis, minio, etc.       │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 10: Wait for initialization                               │
│   sleep 30                                                      │
│   Allow services to fully start                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 11: ⭐ Run Prisma migrations (NEW)                         │
│   docker-compose exec -T api npx prisma migrate deploy         │
│   Applies all pending migrations to Neon Postgres              │
│   Duration: ~10 seconds                                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 12: Verify deployment                                     │
│   docker-compose ps (check all services running)               │
│   curl http://localhost:3001/api/health                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 13: Remote health check                                   │
│   curl https://api.yourdomain.com/api/health                    │
└─────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
┌───────────────────────┐   ┌───────────────────────┐
│ ✅ Success            │   │ ❌ Failure            │
│ Deployment complete   │   │ Trigger rollback      │
└───────────────────────┘   └───────────────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────┐
                        │ ROLLBACK:                 │
                        │ 1. git reset --hard HEAD~1│
                        │ 2. Restart services       │
                        └───────────────────────────┘
```

## 🗄️ Prisma Migration Process

```
┌─────────────────────────────────────────────────────────────────┐
│                   Migration Command Execution                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ docker-compose -f docker-compose.prod.yml                       │
│   exec -T api                                                   │
│   npx prisma migrate deploy                                     │
│                                                                 │
│ Flags:                                                          │
│   -f docker-compose.prod.yml  → Use production config          │
│   exec                         → Execute in running container  │
│   -T                           → Non-interactive (no TTY)      │
│   api                          → Target API service            │
│   migrate deploy               → Apply migrations (prod-safe)  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Load DATABASE_URL                                      │
│   From: .env file on server                                     │
│   Value: postgresql://...@ep-xxx.neon.tech/db?sslmode=require  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Connect to Neon Postgres                               │
│   SSL connection established                                    │
│   Database: whalli_production                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Read local migrations                                  │
│   Directory: apps/api/prisma/migrations/                        │
│   Files: 20241001_initial/, 20241002_add_tasks/, etc.           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Check migration status                                 │
│   Query: SELECT * FROM _prisma_migrations                       │
│   Compare: Local migrations vs Applied migrations              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Apply pending migrations                               │
│   For each pending migration:                                   │
│     1. Begin transaction                                        │
│     2. Execute SQL from migration.sql                           │
│     3. Insert record into _prisma_migrations                    │
│     4. Commit transaction                                       │
└─────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
┌───────────────────────┐   ┌───────────────────────┐
│ ✅ All migrations     │   │ ❌ Migration failed   │
│    applied            │   │    (rollback trans)   │
│    Exit code: 0       │   │    Exit code: 1       │
└───────────────────────┘   └───────────────────────┘
```

## 🔐 Secrets Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Repository                            │
│  Settings → Secrets and variables → Actions                    │
│                                                                 │
│  ┌────────────────────────┐  ┌─────────────────────────────┐  │
│  │  SERVER_HOST           │  │  DATABASE_URL               │  │
│  │  SERVER_USER           │  │  JWT_SECRET                 │  │
│  │  SSH_PRIVATE_KEY       │  │  STRIPE_SECRET_KEY          │  │
│  │  ...                   │  │  ...                        │  │
│  └────────────────────────┘  └─────────────────────────────┘  │
│                 18 secrets total                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ GitHub Actions loads secrets
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Workflow Environment                         │
│  Secrets available as: ${{ secrets.SECRET_NAME }}               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ SSH to server
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Production Server                            │
│  Create .env file:                                              │
│                                                                 │
│  cat > .env << 'EOF'                                            │
│  DATABASE_URL=${{ secrets.DATABASE_URL }}                       │
│  JWT_SECRET=${{ secrets.JWT_SECRET }}                           │
│  STRIPE_SECRET_KEY=${{ secrets.STRIPE_SECRET_KEY }}             │
│  ...                                                            │
│  EOF                                                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Docker Compose reads .env
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Containers                            │
│  Environment variables available in containers:                 │
│  - web: NEXT_PUBLIC_* variables                                 │
│  - api: DATABASE_URL, JWT_SECRET, etc.                          │
│  - workers: Same as API                                         │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Service Dependencies

```
                    ┌─────────────┐
                    │   Traefik   │
                    │ (Port 80/   │
                    │   443)      │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │   Web    │    │   API    │    │  Admin   │
    │ (Next.js)│    │ (NestJS) │    │ (Next.js)│
    │  :3000   │    │  :3001   │    │  :3002   │
    └──────────┘    └────┬─────┘    └──────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  Redis   │  │  MinIO   │  │  Neon    │
    │  :6379   │  │  :9000   │  │ Postgres │
    └──────────┘  └──────────┘  └──────────┘
          ▲              ▲              ▲
          │              │              │
          └──────────────┴──────────────┘
                         │
                    ┌────┴─────┐
                    │ Workers  │
                    │ (BullMQ) │
                    └──────────┘

Monitoring:
    ┌──────────┐         ┌──────────┐
    │Prometheus│ ◄────── │ Grafana  │
    │  :9090   │         │  :3000   │
    └──────────┘         └──────────┘
```

## 🚀 Deployment Timeline

```
Time  │ Action                                          │ Duration
──────┼─────────────────────────────────────────────────┼─────────
0:00  │ Push to main branch                             │ Instant
0:01  │ GitHub Actions triggered                        │ ~5s
0:06  │ Checkout code                                   │ ~10s
0:16  │ Setup SSH                                       │ ~5s
0:21  │ SSH to server                                   │ ~2s
0:23  │ Pull latest code                                │ ~5s
0:28  │ Create .env file                                │ ~1s
0:29  │ Build Docker images                             │ ~5min
5:29  │ Start services                                  │ ~30s
5:59  │ Wait for initialization                         │ 30s
6:29  │ ⭐ Run Prisma migrations                        │ ~10s
6:39  │ Verify health checks                            │ ~5s
6:44  │ ✅ Deployment complete                          │
──────┴─────────────────────────────────────────────────┴─────────
Total deployment time: ~7 minutes
```

## 🔄 Rollback Mechanism

```
┌─────────────────────────────────────────────────────────────────┐
│ Deployment Failure Detected                                     │
│   - Migration failed                                            │
│   - Health check failed                                         │
│   - Service startup failed                                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Trigger Rollback Procedure                                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Revert Git                                              │
│   git reset --hard HEAD~1                                       │
│   (Go back to previous commit)                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Rebuild Images                                          │
│   docker-compose -f docker-compose.prod.yml build               │
│   (Use previous version)                                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Restart Services                                        │
│   docker-compose -f docker-compose.prod.yml up -d               │
│   (Start with working version)                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Notify Failure                                          │
│   GitHub Actions marks workflow as failed                       │
│   Developer receives notification                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ ✅ Rollback Complete                                            │
│   Application running on previous stable version                │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Success vs Failure Paths

```
                    GitHub Actions Workflow
                            │
                            ▼
                    All deployment steps
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ✅ SUCCESS PATH         ❌ FAILURE PATH
                │                       │
                ▼                       ▼
    ┌─────────────────────┐   ┌─────────────────────┐
    │ Migrations applied  │   │ Migration failed    │
    │ Health checks pass  │   │ OR health fail      │
    └─────────────────────┘   └─────────────────────┘
                │                       │
                ▼                       ▼
    ┌─────────────────────┐   ┌─────────────────────┐
    │ Deploy continues    │   │ Trigger rollback    │
    └─────────────────────┘   └─────────────────────┘
                │                       │
                ▼                       ▼
    ┌─────────────────────┐   ┌─────────────────────┐
    │ Mark as successful  │   │ Revert to HEAD~1    │
    │ Notify team         │   │ Restart services    │
    └─────────────────────┘   └─────────────────────┘
                │                       │
                ▼                       ▼
    ┌─────────────────────┐   ┌─────────────────────┐
    │ ✅ Deployment done  │   │ ❌ Deployment failed│
    │ App on latest code  │   │ App on previous code│
    └─────────────────────┘   └─────────────────────┘
```

## 🎯 Workflow Events

```
┌─────────────────────────────────────────────────────────────────┐
│                    Workflow Triggers                            │
└─────────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
          ▼                                   ▼
┌───────────────────────┐         ┌───────────────────────┐
│ Automatic Trigger     │         │ Manual Trigger        │
│                       │         │                       │
│ on:                   │         │ on:                   │
│   push:               │         │   workflow_dispatch:  │
│     branches: [main]  │         │     inputs:           │
│                       │         │       environment:    │
│ Happens when:         │         │         - production  │
│ - Code pushed to main │         │         - staging     │
│ - PR merged to main   │         │                       │
│                       │         │ Triggered by:         │
│                       │         │ - GitHub UI           │
│                       │         │ - GitHub CLI          │
│                       │         │ - API call            │
└───────────────────────┘         └───────────────────────┘
          │                                   │
          └─────────────────┬─────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Workflow executes    │
                │  Same steps for both  │
                └───────────────────────┘
```

---

**Status**: ✅ Complete Visual Guide  
**Diagrams**: 9 ASCII flowcharts and diagrams  
**Version**: 1.0.0  
**Last Updated**: October 5, 2025
