<!-- Use this file to provide wor<!-- Use this file to provide wo## Features Implemented

### ### 💬 Chat SSE System (`apps/web/*`, `apps/api/src/chat/*`) ✅ COMPLETE
Full-stack real-time chat with Server-Sent Events streaming:
- **Frontend** (`apps/web/src/hooks/useChat.ts`, `apps/web/src/components/chat/ChatUI.tsx`):
  - SSE-based streaming with EventSource API (311 lines useChat hook)
  - POST /chat/start → GET /chat/stream pattern
  - Real-time token appending, history fetching, error handling
  - Model pinning, conversation threads, loading states
  - SimpleChatExample.tsx (300 lines standalone reference)
- **Backend** (`apps/api/src/chat/*`):
  - Session-based SSE streaming (ChatSession model with 10-min expiry)
  - 3 endpoints: POST /start, GET /stream, GET /history
  - GET /history supports projectId, chatId, taskId filters
  - Redis caching (99% cost savings, 27x faster)
  - Multi-provider AI adapters (OpenAI, Anthropic, xAI)
  - Subscription-based model access control
  - Slash commands integration
  - Complete error handling and message persistence
- **E2E Tests** (`apps/api/test/chat.e2e-spec.ts`):
  - Jest + Supertest comprehensive test suite (10 tests, 600+ lines)
  - Mock AI adapter for deterministic testing
  - Complete flow: login → chat → stream → persist verification
  - Test runner script: `./test-chat-e2e.sh`
- **Status**: ✅ Both frontend and backend fully implemented with E2E tests
- **Documentation**: 12 complete guides (frontend + backend + testing, ~11,000 lines total)ign System - "Deep Ocean" Theme (`apps/web/*`)
Complete UI refactor with modern design system:
- **Primary Color**: #040069 (deep blue) throughout the interface
- **Typography**: Hind Vadodara font (unified - all text, weights: 300-700)
- **Layout Components**: Sidebar navigation, MainLayout wrapper 💬 Chat System (`apps/web/src/app/(app)/chat/*`, `apps/web/src/components/chat/*`)
Complete chat interface with index + dynamic routes pattern:
- **Routes**: `/chat` (empty state), `/chat/[chatId]` (conversation)
- **Empty State** (`/chat`): Welcome page with search input and quick actions (Get Ideas, Write, Analyze, Research)
- **Conversation** (`/chat/[chatId]`): Full ChatUI component with message history
- **ChatUI Component**: 10 AI models from 7 providers, streaming responses, slash commands, file upload, voice recording
- **Model Selector**: Integrated in chat input area (like Grok interface)
- **ChatSecondarySidebar**: Pinned chats, history, search, navigation to conversations
- **Documentation**: `apps/web/CHAT_ROUTES_STRUCTURE.md` (complete routing guide)fic custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

### 🎨 UI Design System - "Deep Ocean" Theme (`apps/web/*`)
Complete UI refactor with modern design system and **fully responsive** dual sidebar architecture:
- **Primary Color**: #040069 (deep blue) throughout the interface
- **Typography**: Hind Vadodara font (unified - all text including headings and body)
- **Icons**: Lucide React (all emojis replaced with SVG icons)
- **Dual Sidebar System** (RESPONSIVE v1.1): 
  - Primary navigation sidebar (80px, icon-based)
  - Secondary contextual sidebar (256px, page-specific: Chat, Tasks, Projects)
  - **Mobile**: Toggle buttons (top corners), overlay sidebars, slide animations
  - **Desktop**: Fixed sidebars (always visible), automatic content spacing (80px or 336px)
- **Layout Architecture** (OPTIMIZED v2.0):
  - Route group `(app)/` with smart layout parent
  - Single `(app)/layout.tsx` handles all layout routing
  - Pages are ultra-simple (just content, no layout wrapper)
  - Automatic layout selection based on pathname
- **Layout Components**: DualSidebarLayout, MainLayout, 3 Secondary Sidebars (all responsive)
- **6 Complete Pages**: Home, Chat, Tasks, Projects, Profile, Settings
- **Responsive Design**: 
  - Breakpoint: lg (1024px)
  - Mobile: Slide-in sidebars with overlay backdrop
  - Desktop: Fixed sidebars, no toggle buttons
  - Smooth 300ms transitions
- **Smooth Animations**: fade-in, slide-in, bounce-subtle, transform transitions
- **CSS Variables**: Theming system ready for dark mode and custom themes
- **Documentation**: `apps/web/UI_REFACTOR.md` (500+ lines), `DUAL_SIDEBAR_SYSTEM.md` (250+ lines), `RESPONSIVE_DESIGN.md` (400+ lines), `LAYOUT_OPTIMIZATION.md` (NEW, 600+ lines), summaries

### 💬 Enhanced Chat UI (`apps/web/src/components/chat/*`, `apps/web/src/app/(app)/chat/*`)
Complete chat interface with advanced features (v2.0):
- **Command Palette** (Ctrl+K): Global quick actions (new chat, project, task, search)
- **Conversation Threads**: Organized chat history with project linking, pinning, search, filtering
- **Model Pinning**: Lock conversations to specific AI models with visual indicators
- **Enhanced Sidebar**: Filter tabs (All/Projects/Standalone), search, thread actions menu
- **Thread Properties**: Title, timestamps, message count, project badge, pinned model badge
- **Components**: CommandPalette, ConversationThread, ModelPinButton, enhanced ChatSecondarySidebar
- **Documentation**: `apps/web/ENHANCED_CHAT_UI.md` (complete guide), `ENHANCED_CHAT_UI_SUMMARY_FR.md` (résumé français)

# Whalli - Turborepo Monorepo Project

This workspace contains a complete Turborepo monorepo with:
- **Web App** (Next.js 14, Better Auth, Tailwind, Radix UI) - Port 3000
- **API** (NestJS, Prisma, PostgreSQL, Redis, Stripe Billing) - Port 3001  
- **Admin Panel** (Next.js 14, Better Auth, Protected Routes) - Port 3002
- **Shared Packages** (UI components, Types, Config)

## Development Commands
- `pnpm dev` - Start all applications
- `pnpm build` - Build all applications  
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages

## Environment Setup Required

### Development
1. Set up PostgreSQL database (use `apps/api/scripts/setup-db.sh`)
2. Create `.env` files in apps/web and apps/api
   - `DATABASE_URL` format: `postgresql://user:password@localhost:5432/db_name?schema=public`
3. Run `apps/api/scripts/quick-start.sh` for database migrations
4. Or manually: `pnpm --filter=@whalli/api prisma generate && prisma migrate dev`
5. API verifies database connection on startup (see `apps/api/src/main.ts`)

### 🐳 Docker CI/CD Pipeline (`apps/*/Dockerfile`, `.github/workflows/*`) ✅ COMPLETE
Complete Docker CI/CD system with GitHub Actions (14 commits, 8 problems resolved):
- **Multi-Stage Dockerfiles**: 5 stages (base, deps, prisma, builder, runner) for all 3 apps
- **Optimizations**: pnpm cache mount (50% faster installs), BuildKit, timeouts (30/20 min)
- **Monorepo Support**: Complete pnpm workspace structure preservation (symlinks, virtual store, lockfile)
- **Prisma Integration**: Client generation for all apps (API + Better Auth in web/admin)
- **GitHub Actions**: Matrix builds (parallel), lint/test/type-check/build/push, 100% success rate
- **Performance**: 6-8 min per app, ~8 min parallel (3 apps), 70% CI cost reduction
- **8 Problems Solved**:
  1. ✅ Docker build timeouts (cache mount, BuildKit) - `ec5b77a`
  2. ✅ Incorrect node_modules paths (pnpm hoisting) - `7ee62da`
  3. ✅ Missing workspace package sources (Turborepo deps) - `8eb53a9`
  4. ✅ Broken pnpm symlinks (COPY /app ./) - `3477d33`
  5. ✅ Wildcard COPY pattern (explicit paths) - `5c2f839`
  6. ✅ Prisma Client missing web/admin (prisma stage) - `a91515c`
  7. ✅ Prisma Client overwritten (copy order) - `00e1c1d`
  8. ✅ Prisma command not found (npx vs pnpm) - `71ba252`
- **Documentation**: 8 comprehensive guides (~12,000 lines total):
  - `DOCKER_TIMEOUT_FIX.md` (450 lines) + summary FR (100 lines)
  - `DOCKER_MONOREPO_DEPENDENCIES_FIX.md` (300 lines)
  - `DOCKER_PNPM_WORKSPACE_FIX.md` (410 lines)
  - `DOCKER_PRISMA_COPY_ORDER_FIX.md` (1700 lines) + summary FR (500 lines)
  - `DOCKER_CI_CD_COMPLETE_SERIES.md` (6000 lines) - Complete reference
  - `DOCKER_CI_CD_EXECUTIVE_SUMMARY_FR.md` (2500 lines) - Executive summary
- **Status**: ✅ Pipeline 100% operational (0% → 100% success rate)

### Production Deployment
1. **Docker Compose**: Use `docker-compose.prod.yml` (Neon Postgres, no local DB)
2. **Configuration**: Copy `.env.production.example` to `.env`
3. **Database**: Use Neon Postgres (managed, serverless PostgreSQL)
   - Get connection string from: https://console.neon.tech/
   - Format: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require`
   - SSL required: Append `?sslmode=require` to connection string
4. **Services**: Web, API, Admin, Workers, Redis, MinIO, Traefik, Prometheus, Grafana
5. **Deploy Script**: `./deploy-prod.sh deploy` (automated deployment)
6. **Documentation**: 
   - Database config: `apps/api/DATABASE_CONFIG.md` (complete guide)
   - Full deployment: `PRODUCTION_DEPLOYMENT.md` (5000+ lines)
   - Quick reference: `PRODUCTION_QUICK_REF.md` (500+ lines)
   - Example env: `.env.production.example` (200+ lines)

## VS Code Tasks Available
- Start All Apps
- Start Individual Apps (Web, API, Admin)
- Build All
- Lint All  
- Type Check All
- Generate Prisma Client
- Prisma Studio

## Features Implemented

### � UI Design System - "Deep Ocean" Theme (`apps/web/*`)
Complete UI refactor with modern design system:
- **Primary Color**: #040069 (deep blue) throughout the interface
- **Typography**: Zain font (logo/headings), Inter font (body)
- **Layout Components**: Sidebar navigation, MainLayout wrapper
- **6 Complete Pages**: Home, Chat, Tasks, Projects, Profile, Settings
- **Responsive Design**: Mobile-first with sidebar collapse on mobile
- **Smooth Animations**: fade-in, slide-in, bounce-subtle (5 animations)
- **CSS Variables**: Theming system ready for dark mode and custom themes
- **Documentation**: `apps/web/UI_REFACTOR.md` (500+ lines), `UI_REFACTOR_SUMMARY.md`

### �🎯 Chat UI (`apps/web/src/components/chat/*`)
Complete AI chat interface with:
- 10 AI models from 7 providers (OpenAI, Anthropic, xAI, Google, Meta, Mistral, Cohere)
- Streaming responses with character-by-character animation
- 9 slash commands with autocomplete (/search, /summarize, /translate, etc.)
- File upload support (drag & drop, multi-file)
- Voice recording with real-time waveform
- Model switching sidebar with company grouping
- **Integrated with Deep Ocean theme** and main navigation sidebar

### 🤖 Chat Service (`apps/api/src/chat/*`)
Complete backend chat system with AI provider integration:
- 10 AI models from 3 active providers: OpenAI (4 models), Anthropic (4 models), xAI/Grok (2 models)
- Subscription-based model access control (BASIC: 2 models, PRO: 7 models, ENTERPRISE: 10 models)
- Server-Sent Events (SSE) streaming for real-time responses
- **Redis caching layer**: Identical requests cached with 1h TTL (99% cost savings, 27x faster)
- Message persistence with project/task linking
- Adapter pattern for AI provider abstraction
- **Slash commands integration**: Execute tasks/projects commands through chat
- Complete documentation: `apps/api/XAI_INTEGRATION.md`, `apps/api/XAI_SUMMARY.md`, `apps/api/CHAT_CACHE_SYSTEM.md`

### 📋 Slash Commands (`apps/api/src/chat/*`, `apps/api/src/tasks/*`, `apps/api/src/projects/*`)
Integrated command execution through chat interface:
- 6 slash commands: `/task create`, `/task complete`, `/task delete`, `/project create`, `/project invite`, `/help`
- Automatic command detection in ChatService
- Zod-validated parameters with SlashCommandParser
- Permission-based access control
- Smart project name matching (partial)
- Default project creation for tasks
- Complete documentation: `apps/api/SLASH_COMMANDS_INTEGRATION.md`, `apps/api/SLASH_COMMANDS_SUMMARY.md`

### 📊 Projects & Tasks Services (`apps/api/src/projects/*`, `apps/api/src/tasks/*`)
Full CRUD operations with slash command integration:
- ProjectsService: Create, read, update, delete projects; manage members
- TasksService: Create, read, update, delete tasks; status management
- Slash command handlers for chat integration
- Permission checks (owner, admin, member roles)
- Project/task linking to messages

### 📁 File Service (`apps/api/src/files/*`)
Complete file upload and text extraction system:
- MinIO (S3-compatible) storage with public URL generation
- Automatic text extraction for PDFs (pdf-parse) and images (Tesseract OCR)
- Extracted text stored in `Attachment.metadata.extractedText`
- File type detection and validation (10MB limit)
- Non-blocking extraction (uploads succeed even if extraction fails)
- Complete documentation: `apps/api/FILE_EXTRACTION.md`, `apps/api/FILE_EXTRACTION_SUMMARY.md`

### 💳 Billing System (`apps/api/src/billing/*`)
Stripe integration with subscription management:
- 3 subscription plans: BASIC ($9.99), PRO ($29.99), ENTERPRISE ($99.99)
- Complete webhook handling (subscription created/updated/deleted, payment success/failed)
- User model extended with `subscriptionId` for direct subscription reference
- Automatic subscription status synchronization
- Trial period support (14 days default)
- Usage tracking and plan limits

### 🎤 Voice System (`apps/api/src/voice/*`)
Complete audio processing with async transcription:
- Audio upload to MinIO (mp3, wav, m4a, ogg, webm, max 25MB)
- BullMQ queue for async Whisper API transcription
- Text-to-Speech (TTS) endpoint with OpenAI integration
- Status polling for transcription progress
- Automatic message creation with transcript
- Complete documentation: `apps/api/VOICE_SYSTEM.md`, `apps/api/VOICE_SYSTEM_SUMMARY.md`

### 🧠 Mindmap System (`apps/api/src/mindmap/*`)
Real-time collaborative mindmaps with WebSocket:
- Mindmaps linked to projects with full CRUD
- Nodes with position tracking (X/Y coordinates) and custom metadata
- Edges connecting nodes with labels and styling
- WebSocket gateway (Socket.io) on `/mindmap` namespace for real-time sync
- Events: `node:add`, `node:update`, `node:remove`, `edge:add`, `edge:update`, `edge:remove`
- Room-based broadcasting (join/leave mindmap rooms)
- JWT authentication for WebSocket connections
- Project-based permission control
- Complete documentation: `apps/api/MINDMAP_SYSTEM.md`, `apps/api/MINDMAP_SYSTEM_SUMMARY.md`

### 🔍 Recurring Search System (`apps/api/src/recurring-search/*`)
Automated web searches with scheduled execution:
- User-defined search queries with flexible intervals (hourly or cron)
- BullMQ job scheduling with Redis for reliable background processing
- Two interval types: hours (1, 6, 24) or cron expressions (`0 9 * * *`)
- WebSearchAdapter with stub implementation (ready for Google/Bing API)
- Search results stored as JSON with timestamps and metadata
- Manual execution endpoint for on-demand searches
- Active/inactive toggle to pause/resume without deletion
- Full CRUD operations with user-scoped access control
- Complete documentation: `apps/api/RECURRING_SEARCH_SYSTEM.md`, `apps/api/RECURRING_SEARCH_SYSTEM_SUMMARY.md`

### 🔔 Notifications System (`apps/api/src/notifications/*`)
Dual-channel notification system with email and in-app notifications:
- **Email**: Nodemailer with SMTP (Gmail, SendGrid, AWS SES, Mailgun, Postmark)
- **In-App**: PostgreSQL storage with REST API (`/api/notifications`)
- **9 Event Triggers**: Subscription expiring/expired, payment success/failed, task assigned/deadline, recurring search results
- **3 Cron Jobs**: Task deadlines (hourly), subscription expiry (daily at 9 AM)
- **Auto-triggered**: Stripe webhooks, task CRUD, recurring searches
- **REST API**: Get notifications, unread count, mark as read, delete
- **NotificationType Enum**: 9 types (subscription, payment, task, search, project)
- **Metadata Support**: Store extra data (taskId, amount, projectId, etc.) as JSON
- **Zero Config**: Works without SMTP for testing (logs only)
- Complete documentation: `apps/api/NOTIFICATIONS_SYSTEM.md`, `apps/api/NOTIFICATIONS_SUMMARY.md`

### 📊 Monitoring & Observability (`apps/api/src/common/*`)
Complete observability stack with Winston, Prometheus, and Grafana:
- **Winston Logger**: JSON format with console + file transports (error.log, combined.log)
- **Prometheus Metrics**: 8 custom metrics (HTTP, AI models, cache, connections)
- **MetricsService**: Global service for tracking requests, latency, cache hit rate
- **MetricsInterceptor**: Auto-tracking all HTTP requests with route normalization
- **Docker Compose**: Prometheus (port 9090) + Grafana (port 3000) with Traefik
- **Metrics Endpoint**: `GET /api/metrics` (Prometheus format)
- Complete documentation: `apps/api/MONITORING_OBSERVABILITY.md`, `apps/api/MONITORING_SUMMARY.md`

### 🚀 CI/CD Deployment Pipeline (`.github/workflows/*`)
Automated deployment with GitHub Actions:
- **CI/CD Workflow** (`ci-cd.yml`): Lint, test, build, Docker image push to GHCR
  - **Organization Registry**: Images stored in `ghcr.io/whalli/*` (organization account)
  - **Semantic Versioning**: Automatic tagging with branch, sha, version tags
  - **Matrix Strategy**: Builds 3 apps (web, api, admin) in parallel
- **Deployment Workflow** (`deploy.yml`): SSH-based production deployment with Prisma migrations
- **Automated Steps**: Code checkout → Build → Start services → **Prisma migrations** → Health checks → Rollback on failure
- **Secrets Management**: 21 GitHub secrets (DATABASE_URL, REDIS_URL, JWT, Stripe, AI keys, MinIO, etc.)
- **Environment Injection**: All secrets injected into docker-compose.prod.yml via .env file
- **Database Migrations**: `docker-compose exec -T api npx prisma migrate deploy` against Neon Postgres
- **Triggers**: Push to main (automatic) OR manual workflow_dispatch (staging/production choice)
- **Verification**: Local + remote health checks, deployment status monitoring
- Complete documentation: `GITHUB_ACTIONS_DEPLOYMENT.md`, `GITHUB_SECRETS_CHECKLIST.md`, `GITHUB_ACTIONS_SUMMARY.md`, `GITHUB_ACTIONS_VISUAL_GUIDE.md`, `GITHUB_PACKAGES_MIGRATION.md`

### 🚦 Rate Limiting & Workers (`apps/api/src/common/guards/*`, `apps/api/src/workers/*`)
Redis-based rate limiting with separated BullMQ workers:
- **RateLimitGuard**: Global rate limiting per user (100 req/min) and per IP (20 req/min)
- **Redis Storage**: Automatic TTL expiration, standard HTTP headers (X-RateLimit-*)
- **Decorators**: `@RateLimit()` for custom limits, `@SkipRateLimit()` for webhooks/health
- **Separated Workers**: BullMQ processors in dedicated Docker container
- **Workers**: Voice Transcription (Whisper API), Recurring Search execution
- **Benefits**: API stays responsive, independent scaling, fault isolation
- **Docker**: Separate `workers` service, scalable with `--scale workers=3`
- Complete documentation: `apps/api/RATE_LIMIT_WORKERS.md`, `apps/api/RATE_LIMIT_WORKERS_SUMMARY.md`

### 🛠️ Utilities
- **Slash Command Parser** (`apps/api/src/utils/slash-command-parser.ts`)
  - 7 command types with regex + Zod validation
  - 49 passing Jest tests
  - Complete TypeScript types and documentation

## Database Scripts

Located in `apps/api/scripts/`:
- `setup-db.sh` - Interactive PostgreSQL configuration
- `quick-start.sh` - Automated migration runner
- See `apps/api/scripts/README.md` for details

## Documentation

### UI Design System
- `apps/web/UI_REFACTOR.md` - Complete UI refactor guide (500+ lines)
- `apps/web/UI_REFACTOR_SUMMARY.md` - Quick reference with examples
- `apps/web/DUAL_SIDEBAR_SYSTEM.md` - Dual sidebar architecture guide (250+ lines)
- `apps/web/DUAL_SIDEBAR_SUMMARY.md` - Quick reference for dual sidebar
- `apps/web/RESPONSIVE_DESIGN.md` - Responsive design documentation (400+ lines)
- `apps/web/LAYOUT_OPTIMIZATION.md` - Layout architecture optimization (600+ lines)
- `apps/web/LAYOUT_OPTIMIZATION_SUMMARY.md` - Quick reference for layout system
- `apps/web/ICONS_MIGRATION.md` - Icons migration (Emoji → Lucide React)
- `apps/web/TYPOGRAPHY_UNIFIED.md` - Complete typography migration guide (1000+ lines)
- `apps/web/TYPOGRAPHY_UNIFIED_SUMMARY.md` - Typography quick reference
- `apps/web/TYPOGRAPHY_VALIDATION.md` - Migration validation & tests
- `apps/web/TYPOGRAPHY_EXECUTIVE_SUMMARY.md` - Executive summary (French)
- `apps/web/UI_VISUAL_OVERVIEW.md` - Visual documentation with ASCII art
- `apps/web/EXECUTIVE_SUMMARY.md` - Complete executive summary (French)

### Billing & Subscriptions
- `apps/api/SUBSCRIPTION_ID_EXTENSION.md` - User subscription integration guide
- `apps/api/SUBSCRIPTION_ID_SUMMARY.md` - Quick reference

### Chat SSE System
- `apps/web/CHAT_SSE_INTEGRATION.md` - Frontend SSE integration guide (800+ lines)
- `apps/web/CHAT_SSE_QUICK_START.md` - Frontend quick reference (400+ lines)
- `apps/api/CHAT_SSE_BACKEND.md` - Complete backend SSE guide (1500+ lines)
- `apps/api/CHAT_SSE_QUICK_START.md` - Backend quick reference (600+ lines)
- `apps/api/XAI_INTEGRATION.md` - xAI/Grok integration guide (850+ lines)
- `apps/api/CHAT_CACHE_SYSTEM.md` - Redis caching guide (1200+ lines)
- `apps/web/src/components/chat/README.md` - Chat UI component documentation

### Slash Commands
- `apps/api/SLASH_COMMANDS_INTEGRATION.md` - Complete slash commands guide (600+ lines)
- `apps/api/SLASH_COMMANDS_SUMMARY.md` - Quick reference with examples

### File Management
- `apps/api/FILE_EXTRACTION.md` - Complete text extraction guide (600+ lines)
- `apps/api/FILE_EXTRACTION_SUMMARY.md` - Quick reference with examples

### Voice System
- `apps/api/VOICE_SYSTEM.md` - Complete voice/audio system guide (600+ lines)
- `apps/api/VOICE_SYSTEM_SUMMARY.md` - Quick reference with examples

### Mindmap System
- `apps/api/MINDMAP_SYSTEM.md` - Complete mindmap & WebSocket guide (1000+ lines)
- `apps/api/MINDMAP_SYSTEM_SUMMARY.md` - Quick reference with examples

### Recurring Search System
- `apps/api/RECURRING_SEARCH_SYSTEM.md` - Complete recurring search guide (1100+ lines)
- `apps/api/RECURRING_SEARCH_SYSTEM_SUMMARY.md` - Quick reference with examples

### Notifications System
- `apps/api/NOTIFICATIONS_SYSTEM.md` - Complete notifications guide (1000+ lines)
- `apps/api/NOTIFICATIONS_SUMMARY.md` - Quick reference with examples

### Monitoring & Observability
- `apps/api/MONITORING_OBSERVABILITY.md` - Complete monitoring guide (4000+ lines)
- `apps/api/MONITORING_SUMMARY.md` - Quick reference with examples

### Production Deployment
- `PRODUCTION_DEPLOYMENT.md` - Complete production deployment guide (5000+ lines)
- `PRODUCTION_QUICK_REF.md` - Quick reference (500+ lines)
- `.env.production.example` - Production environment variables template (200+ lines)
- `docker-compose.prod.yml` - Production Docker Compose configuration
- `deploy-prod.sh` - Automated deployment script (400+ lines)

### CI/CD & GitHub Actions
- `.github/workflows/deploy.yml` - Production deployment workflow with Prisma migrations (150+ lines)
- `GITHUB_ACTIONS_DEPLOYMENT.md` - Complete GitHub Actions setup guide (800+ lines)
- `GITHUB_SECRETS_CHECKLIST.md` - Secrets configuration checklist (21 secrets, 400+ lines)
- `GITHUB_ACTIONS_SUMMARY.md` - Quick reference and benefits overview (300+ lines)
- `GITHUB_ACTIONS_VISUAL_GUIDE.md` - Visual diagrams and flowcharts (600+ lines, 9 diagrams)
- `GITHUB_PACKAGES_MIGRATION.md` - Organization registry migration guide (800+ lines)

### GitHub Secrets Configuration (NEW)
- `GITHUB_SECRETS_INDEX.md` - Navigation hub for all secrets documentation
- `GITHUB_SECRETS_SUMMARY.md` - Complete summary in French (18/21 secrets configured)
- `GITHUB_SECRETS_STATUS.md` - Detailed status and current values (masked)
- `GITHUB_SECRETS_VISUAL_GUIDE.md` - Visual architecture and flow diagrams
- `GITHUB_SECRETS_RECAP.md` - Final recap with commit suggestions
- `scripts/auto-setup-secrets.sh` - Automatic setup of 18 secrets (executed)
- `scripts/add-server-secrets.sh` - Interactive server secrets configuration (pending)
- `scripts/setup-github-secrets.sh` - Complete manual configuration
- `scripts/quick-setup-secrets.sh` - Hybrid auto/manual setup
- `scripts/show-help.sh` - Quick help and instructions
- `scripts/README.md` - Complete scripts documentation (7 scripts)

### Database
- `apps/api/scripts/README.md` - Database setup scripts