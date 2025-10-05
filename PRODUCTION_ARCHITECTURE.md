# Production Architecture Diagram

## System Overview

```
                                    INTERNET
                                       │
                                       ▼
                              ┌────────────────┐
                              │  DNS Records   │
                              │  *.mydomain    │
                              └────────┬───────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │    Traefik     │ :80, :443
                              │  Reverse Proxy │ (SSL/TLS)
                              └────────┬───────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
        ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
        │   Web (Next.js) │  │  API (NestJS)   │  │ Admin (Next.js) │
        │ app.mydomain.com│  │ api.mydomain.com│  │admin.mydomain.com│
        │     Port 3000   │  │    Port 3001    │  │    Port 3002    │
        └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
                 │                    │                     │
                 └────────────────────┼─────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
         ┌──────────────────┐ ┌──────────────┐ ┌─────────────────┐
         │  Neon Postgres   │ │    Redis     │ │  MinIO (S3)     │
         │ (External/Cloud) │ │   :6379      │ │ storage.mydomain│
         │  Managed DBaaS   │ │  Cache/Queue │ │   Port 9000     │
         └──────────────────┘ └──────┬───────┘ └─────────────────┘
                                      │
                                      ▼
                             ┌─────────────────┐
                             │     Workers     │
                             │  (BullMQ Jobs)  │
                             │  - Transcription│
                             │  - Web Search   │
                             └─────────────────┘

         ┌──────────────────┐        ┌─────────────────┐
         │   Prometheus     │◄───────│    Grafana      │
         │prometheus.domain │        │grafana.mydomain │
         │   Port 9090      │        │   Port 3000     │
         └──────────────────┘        └─────────────────┘
```

## Network Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Docker Network                              │
│                         (whalli-network)                             │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │   Web    │  │   API    │  │  Admin   │  │ Workers  │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │             │              │              │                  │
│       └─────────────┼──────────────┴──────────────┘                 │
│                     │                                                │
│       ┌─────────────┼──────────────┐                                │
│       │             │              │                                 │
│  ┌────▼─────┐  ┌───▼────┐  ┌─────▼──────┐                         │
│  │  Redis   │  │ MinIO  │  │ Prometheus │                          │
│  └──────────┘  └────────┘  └────────────┘                          │
│                                                                       │
└───────────────────────────────────────────────────────────────────┬─┘
                                                                     │
                                                          ┌──────────▼─────────┐
                                                          │   Neon Postgres    │
                                                          │  (External Cloud)  │
                                                          │   Serverless DB    │
                                                          └────────────────────┘
```

## Data Flow

### 1. User Request Flow

```
User Browser
    │
    ▼
HTTPS (app.mydomain.com)
    │
    ▼
Traefik (SSL Termination, Routing)
    │
    ▼
Web App (Next.js)
    │
    ├──► Neon Postgres (User Auth via Better Auth)
    │
    └──► API (https://api.mydomain.com)
         │
         ├──► Redis (Cache, Sessions, Queues)
         ├──► Neon Postgres (Data Persistence)
         ├──► MinIO (File Storage)
         └──► AI Providers (OpenAI, Anthropic, xAI)
```

### 2. Chat Request Flow (SSE)

```
User types message
    │
    ▼
POST /api/chat/start
    │
    ├──► Create ChatSession in Redis
    ├──► Save Message in Neon Postgres
    └──► Return sessionId
    │
    ▼
GET /api/chat/stream?sessionId=xxx (EventSource)
    │
    ├──► Check Redis Cache (identical prompt?)
    │    └──► Cache Hit: Stream cached response (instant)
    │
    └──► Cache Miss:
         │
         ├──► Route to AI Adapter (OpenAI/Anthropic/xAI)
         ├──► Stream tokens to client (SSE)
         ├──► Cache response in Redis (1h TTL)
         └──► Persist final message in Neon Postgres
```

### 3. File Upload Flow

```
User uploads file
    │
    ▼
POST /api/files/upload
    │
    ├──► Upload to MinIO (S3-compatible)
    ├──► Create Attachment record in Neon Postgres
    └──► Enqueue extraction job in Redis (BullMQ)
    │
    ▼
Worker picks up job
    │
    ├──► Download file from MinIO
    ├──► Extract text (PDF: pdf-parse, Image: Tesseract)
    ├──► Update Attachment.metadata.extractedText in Neon Postgres
    └──► Job complete
```

### 4. Background Job Flow (Workers)

```
API creates job (e.g., voice transcription)
    │
    ▼
BullMQ Queue in Redis
    │
    ▼
Worker polls queue
    │
    ├──► Voice Transcription:
    │    ├──► Download audio from MinIO
    │    ├──► Send to OpenAI Whisper API
    │    ├──► Save transcript in Neon Postgres
    │    └──► Create Message with transcript
    │
    └──► Recurring Search:
         ├──► Execute web search (Google/Bing API)
         ├──► Save results in Neon Postgres
         └──► Send notification (email + in-app)
```

## Service Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    Dependency Graph                          │
│                                                               │
│  Traefik                                                      │
│     │                                                         │
│     ├──► Web ──────┬──► Neon Postgres                       │
│     │              └──► API                                   │
│     │                                                         │
│     ├──► API ──────┬──► Neon Postgres                       │
│     │              ├──► Redis                                │
│     │              ├──► MinIO                                │
│     │              └──► External APIs (OpenAI, etc.)         │
│     │                                                         │
│     ├──► Admin ────┬──► Neon Postgres                       │
│     │              └──► API                                   │
│     │                                                         │
│     ├──► Grafana ──► Prometheus                             │
│     └──► Prometheus                                          │
│                                                               │
│  Workers ──────────┬──► Neon Postgres                       │
│                    ├──► Redis (BullMQ)                       │
│                    ├──► MinIO                                │
│                    └──► External APIs (OpenAI, etc.)         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Port Mapping

```
┌────────────────┬──────────┬─────────────────────────────────┐
│    Service     │   Port   │         Access URL              │
├────────────────┼──────────┼─────────────────────────────────┤
│ Traefik HTTP   │    80    │ http://mydomain.com             │
│ Traefik HTTPS  │   443    │ https://mydomain.com            │
│ Traefik Dash   │  8080    │ https://traefik.mydomain.com    │
├────────────────┼──────────┼─────────────────────────────────┤
│ Web (Next.js)  │  3000    │ https://app.mydomain.com        │
│ API (NestJS)   │  3001    │ https://api.mydomain.com        │
│ Admin (Next.js)│  3002    │ https://admin.mydomain.com      │
├────────────────┼──────────┼─────────────────────────────────┤
│ Redis          │  6379    │ Internal only                   │
│ MinIO API      │  9000    │ https://storage.mydomain.com    │
│ MinIO Console  │  9001    │ https://minio.mydomain.com      │
├────────────────┼──────────┼─────────────────────────────────┤
│ Prometheus     │  9090    │ https://prometheus.mydomain.com │
│ Grafana        │  3000    │ https://grafana.mydomain.com    │
└────────────────┴──────────┴─────────────────────────────────┘
```

## SSL/TLS Configuration

```
Let's Encrypt (ACME)
    │
    ├──► app.mydomain.com     (Web)
    ├──► api.mydomain.com     (API)
    ├──► admin.mydomain.com   (Admin)
    ├──► grafana.mydomain.com (Grafana)
    ├──► prometheus.mydomain.com (Prometheus)
    ├──► storage.mydomain.com (MinIO API)
    ├──► minio.mydomain.com   (MinIO Console)
    └──► traefik.mydomain.com (Traefik Dashboard)

All certificates:
- Auto-generated on first request
- Auto-renewed every 60 days
- Stored in: traefik-letsencrypt volume
```

## Storage Volumes

```
┌─────────────────────┬─────────────────────────────────────┐
│       Volume        │            Purpose                  │
├─────────────────────┼─────────────────────────────────────┤
│ redis-data          │ Redis persistence (AOF + RDB)       │
│ minio-data          │ MinIO file storage (S3 objects)     │
│ traefik-letsencrypt │ SSL certificates                    │
│ prometheus-data     │ Prometheus metrics (TSDB)           │
│ grafana-data        │ Grafana dashboards + config         │
└─────────────────────┴─────────────────────────────────────┘

Note: No postgres-data volume (using external Neon Postgres)
```

## Environment Separation

```
┌──────────────────────────────────────────────────────────┐
│                Development vs Production                  │
│                                                            │
│  Development (docker-compose.yml):                        │
│    ├── Local PostgreSQL (port 5432)                      │
│    ├── Local Redis (port 6379)                           │
│    ├── Local MinIO (port 9000)                           │
│    └── Hot reload enabled                                │
│                                                            │
│  Production (docker-compose.prod.yml):                    │
│    ├── Neon Postgres (managed, external)                 │
│    ├── Redis (persistent, password-protected)            │
│    ├── MinIO (production-ready)                          │
│    ├── Traefik (SSL, routing, monitoring)                │
│    ├── Prometheus + Grafana (observability)              │
│    └── Optimized builds (no hot reload)                  │
└──────────────────────────────────────────────────────────┘
```

## Scaling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Horizontal Scaling                        │
│                                                               │
│  Web/API/Admin:                                              │
│    └──► Add more containers behind Traefik                  │
│         docker-compose up -d --scale api=3                   │
│                                                               │
│  Workers:                                                     │
│    └──► Scale independently (CPU-intensive tasks)           │
│         docker-compose up -d --scale workers=5               │
│                                                               │
│  Redis:                                                       │
│    └──► Use Redis Cluster (multi-node) for high traffic    │
│                                                               │
│  Neon Postgres:                                              │
│    └──► Auto-scales (serverless, connection pooling)       │
│                                                               │
│  MinIO:                                                       │
│    └──► Distributed mode for multi-node storage            │
└─────────────────────────────────────────────────────────────┘
```

## Monitoring Stack

```
┌───────────────────────────────────────────────────────────┐
│                  Observability Pipeline                    │
│                                                             │
│  Application Metrics (API, Workers):                       │
│    └──► /api/metrics endpoint (Prometheus format)         │
│                   │                                         │
│                   ▼                                         │
│              Prometheus (scrapes every 15s)                │
│                   │                                         │
│                   ├──► Time-series database (TSDB)         │
│                   └──► Alerts (via Alertmanager)           │
│                   │                                         │
│                   ▼                                         │
│              Grafana Dashboards                            │
│                   │                                         │
│                   ├──► HTTP Request Rate                   │
│                   ├──► API Latency (p50, p95, p99)         │
│                   ├──► Cache Hit Rate                      │
│                   ├──► AI Model Usage                      │
│                   ├──► Active WebSocket Connections        │
│                   └──► Error Rate                          │
│                                                             │
│  Logs (Winston):                                           │
│    └──► File: /app/logs/combined.log                      │
│         └──► Rotate daily (winston-daily-rotate-file)     │
└───────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Stack                          │
│                                                               │
│  Network:                                                     │
│    ├──► Firewall (UFW): Only 22, 80, 443 open              │
│    ├──► Docker internal network (isolated)                  │
│    └──► External services (Neon) use SSL/TLS                │
│                                                               │
│  SSL/TLS:                                                     │
│    ├──► Let's Encrypt certificates (auto-renewal)           │
│    ├──► HTTPS enforced (HTTP → HTTPS redirect)             │
│    └──► TLS 1.2+ only                                       │
│                                                               │
│  Authentication:                                              │
│    ├──► Better Auth (JWT + refresh tokens)                  │
│    ├──► OAuth (GitHub, Google)                              │
│    ├──► Basic Auth (Traefik, Prometheus dashboards)         │
│    └──► Redis sessions (10-min expiry)                      │
│                                                               │
│  Authorization:                                               │
│    ├──► Role-based access control (RBAC)                    │
│    ├──► Project-based permissions                           │
│    └──► Subscription-based model access                     │
│                                                               │
│  Rate Limiting:                                               │
│    ├──► Per-user: 100 req/min                              │
│    ├──► Per-IP: 20 req/min                                 │
│    └──► Redis-based (distributed)                           │
│                                                               │
│  Secrets Management:                                          │
│    ├──► .env file (never committed)                         │
│    ├──► Docker secrets (production)                         │
│    └──► Minimum 32-char passwords                          │
└─────────────────────────────────────────────────────────────┘
```

## Backup Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     Backup Architecture                      │
│                                                               │
│  Neon Postgres:                                              │
│    ├──► Automatic backups (Neon managed)                    │
│    ├──► Point-in-time recovery (PITR)                       │
│    └──► Manual export via pg_dump                           │
│                                                               │
│  Redis:                                                       │
│    ├──► AOF (Append-Only File) persistence                  │
│    ├──► RDB snapshots (every 60s if 1000+ changes)          │
│    └──► Daily backup script (./deploy-prod.sh backup)       │
│                                                               │
│  MinIO:                                                       │
│    ├──► Volume backup (tar.gz)                              │
│    ├──► Daily backup script                                 │
│    └──► Optional: Replicate to S3/Backblaze B2              │
│                                                               │
│  Schedule:                                                    │
│    └──► Cron job: Daily at 2 AM                            │
│         0 2 * * * /opt/whalli/backup.sh                     │
│                                                               │
│  Retention:                                                   │
│    └──► Keep 7 days locally, 30 days offsite                │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  Deployment Pipeline                         │
│                                                               │
│  Developer:                                                   │
│    └──► git push origin main                                │
│         │                                                     │
│         ▼                                                     │
│  Server:                                                      │
│    ├──► git pull origin main                                │
│    ├──► ./deploy-prod.sh update                             │
│    │    ├──► Build Docker images                            │
│    │    ├──► Run Prisma migrations                          │
│    │    └──► Restart services (rolling)                     │
│    │                                                          │
│    └──► Zero-downtime deployment:                           │
│         ├──► Build new images                               │
│         ├──► Start new containers                           │
│         ├──► Health checks pass                             │
│         └──► Stop old containers                            │
│                                                               │
│  Rollback (if issues):                                       │
│    └──► git revert HEAD && ./deploy-prod.sh update          │
└─────────────────────────────────────────────────────────────┘
```

---

**Legend:**
- `│ └ ┌ ┐ ┬ ┴ ┼ ─ ═ ▼ ▲ ◄ ►` - Connection lines
- `[Service]` - Docker container
- `External` - Cloud service (not in Docker)
- `---►` - Data flow direction

**Version**: 1.0.0  
**Last Updated**: October 5, 2025
