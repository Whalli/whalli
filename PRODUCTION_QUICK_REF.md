# Production Deployment - Quick Reference

## 📋 Overview

Production Docker Compose configuration for Whalli with:
- ❌ **Removed**: PostgreSQL (using Neon instead)
- ✅ **Kept**: Web, API, Admin, Workers, Redis, MinIO, Traefik, Prometheus, Grafana
- 🔒 **Security**: SSL via Let's Encrypt, Basic Auth, environment variables

## 🌐 Domain Structure

```
mydomain.com                    -> app.mydomain.com (redirect)
app.mydomain.com                -> Web (Next.js)
api.mydomain.com                -> API (NestJS)
admin.mydomain.com              -> Admin (Next.js)
grafana.mydomain.com            -> Grafana Dashboard
prometheus.mydomain.com         -> Prometheus Metrics
storage.mydomain.com            -> MinIO S3 API
minio.mydomain.com              -> MinIO Console
traefik.mydomain.com            -> Traefik Dashboard
```

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Copy example env file
cp .env.production.example .env

# Edit with your values
nano .env
```

**Critical Variables:**
```env
DOMAIN=mydomain.com
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require
REDIS_PASSWORD=secure-password-here
JWT_SECRET=secure-secret-here
BETTER_AUTH_SECRET=secure-secret-here
STRIPE_SECRET_KEY=sk_live_xxx
OPENAI_API_KEY=sk-xxx
```

### 2. Generate Secrets

```bash
# Use the deployment script
./deploy-prod.sh secrets

# Or manually
openssl rand -base64 32  # For JWT_SECRET, BETTER_AUTH_SECRET, REDIS_PASSWORD
htpasswd -nb admin your-password  # For TRAEFIK_AUTH, PROMETHEUS_AUTH
```

### 3. Deploy

```bash
# One-command deployment
./deploy-prod.sh deploy

# Or step-by-step
./deploy-prod.sh check      # Check prerequisites
./deploy-prod.sh build      # Build images
./deploy-prod.sh migrate    # Run migrations
./deploy-prod.sh start      # Start services
./deploy-prod.sh health     # Check health
```

## 📦 Deployment Script Commands

```bash
./deploy-prod.sh check          # Check prerequisites
./deploy-prod.sh secrets        # Generate secure secrets
./deploy-prod.sh build          # Build Docker images
./deploy-prod.sh migrate        # Run database migrations
./deploy-prod.sh start          # Start all services
./deploy-prod.sh stop           # Stop all services
./deploy-prod.sh restart        # Restart all services
./deploy-prod.sh logs [service] # View logs
./deploy-prod.sh health         # Check service health
./deploy-prod.sh backup         # Backup data
./deploy-prod.sh update         # Update application
./deploy-prod.sh scale [N]      # Scale workers
./deploy-prod.sh deploy         # Full deployment
```

## 🔧 Manual Deployment (Without Script)

```bash
# 1. Build images
docker-compose -f docker-compose.prod.yml build

# 2. Start services
docker-compose -f docker-compose.prod.yml up -d

# 3. View logs
docker-compose -f docker-compose.prod.yml logs -f

# 4. Check status
docker-compose -f docker-compose.prod.yml ps

# 5. Run migrations
docker-compose -f docker-compose.prod.yml exec api pnpm prisma migrate deploy

# 6. Scale workers
docker-compose -f docker-compose.prod.yml up -d --scale workers=3
```

## 🗄️ Database (Neon Postgres)

### Setup
1. Create account: https://neon.tech/
2. Create project (choose region)
3. Copy connection string
4. Add to `.env` as `DATABASE_URL`

### Connection String Format
```
postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### Pooled vs Direct
```env
# Pooled (for API - high connection count)
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require

# Direct (for migrations/Prisma Studio)
DIRECT_DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require
```

## 🔐 Environment Variables

### Required Secrets (Generate with `openssl rand -base64 32`)
- `JWT_SECRET` - JWT signing key
- `BETTER_AUTH_SECRET` - Better Auth secret
- `REDIS_PASSWORD` - Redis password
- `MINIO_ROOT_PASSWORD` - MinIO admin password

### Database
- `DATABASE_URL` - Neon Postgres connection string

### Stripe (Production Keys)
- `STRIPE_SECRET_KEY` - `sk_live_xxx`
- `STRIPE_WEBHOOK_SECRET` - `whsec_xxx`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - `pk_live_xxx`

### AI Providers
- `OPENAI_API_KEY` - `sk-xxx`
- `ANTHROPIC_API_KEY` - `sk-ant-xxx`
- `XAI_API_KEY` - `xai-xxx`

### OAuth Apps
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`

### SMTP (Email)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`

### Basic Auth (Generate with `htpasswd -nb admin password`)
- `TRAEFIK_AUTH` - Traefik dashboard auth
- `PROMETHEUS_AUTH` - Prometheus auth

## 🌍 DNS Configuration

### Wildcard (Recommended)
```
A    mydomain.com         -> YOUR_SERVER_IP
A    *.mydomain.com       -> YOUR_SERVER_IP
```

### Individual Subdomains
```
A    app.mydomain.com       -> YOUR_SERVER_IP
A    api.mydomain.com       -> YOUR_SERVER_IP
A    admin.mydomain.com     -> YOUR_SERVER_IP
A    grafana.mydomain.com   -> YOUR_SERVER_IP
A    prometheus.mydomain.com -> YOUR_SERVER_IP
A    storage.mydomain.com   -> YOUR_SERVER_IP
A    minio.mydomain.com     -> YOUR_SERVER_IP
A    traefik.mydomain.com   -> YOUR_SERVER_IP
```

## 🔒 SSL Certificates

**Automatic via Let's Encrypt**
- Configured in Traefik
- Auto-renewal every 60 days
- No manual configuration needed

**Testing with Staging**
Add to Traefik command in `docker-compose.prod.yml`:
```yaml
- --certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory
```

## 🔌 Webhook Configuration

### Stripe Webhooks
1. Login: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://api.mydomain.com/api/billing/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### OAuth Apps

**GitHub:**
1. Visit: https://github.com/settings/developers
2. Create OAuth App
3. Callback URLs:
   - `https://app.mydomain.com/api/auth/callback/github`
   - `https://admin.mydomain.com/api/auth/callback/github`

**Google:**
1. Visit: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Authorized redirect URIs:
   - `https://app.mydomain.com/api/auth/callback/google`
   - `https://admin.mydomain.com/api/auth/callback/google`

## 📊 Monitoring

### Access URLs
- **Grafana**: https://grafana.mydomain.com (admin / your-password)
- **Prometheus**: https://prometheus.mydomain.com (requires basic auth)

### Key Metrics
```
http_requests_total                  # Total HTTP requests
http_request_duration_seconds        # Request latency
ai_model_requests_total              # AI model usage
cache_hit_rate                       # Redis cache performance
active_connections                   # WebSocket connections
```

### Grafana Dashboards
Import from grafana.com:
- **Node Exporter**: 1860
- **Docker**: 893
- **Redis**: 763

## 🔥 Common Issues & Solutions

### Issue: Let's Encrypt Rate Limit
**Solution**: Use staging server first, then production

### Issue: API Can't Connect to Neon
**Solution**: 
- Check `DATABASE_URL` format
- Ensure `?sslmode=require` is present
- Verify outbound connections allowed

### Issue: Redis Authentication Error
**Solution**: 
- Check `REDIS_PASSWORD` in `.env`
- Restart API: `./deploy-prod.sh restart`

### Issue: Workers Not Processing Jobs
**Solution**:
```bash
# Check logs
./deploy-prod.sh logs workers

# Scale workers
./deploy-prod.sh scale 5
```

## 💾 Backup & Restore

### Automatic Backup (Recommended)
```bash
# Create backup script
cat > /opt/whalli/backup.sh << 'EOF'
#!/bin/bash
./deploy-prod.sh backup
EOF

# Add to crontab (daily at 2 AM)
0 2 * * * /opt/whalli/backup.sh >> /var/log/whalli-backup.log 2>&1
```

### Manual Backup
```bash
# Backup all data
./deploy-prod.sh backup

# Backups saved to: ./backups/
# - redis-YYYYMMDD-HHMMSS.rdb
# - minio-YYYYMMDD-HHMMSS.tar.gz
```

### Restore
```bash
# Redis restore
docker cp backups/redis-xxx.rdb whalli-redis-prod:/data/dump.rdb
docker-compose -f docker-compose.prod.yml restart redis

# MinIO restore
docker run --rm \
  -v whalli_minio-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/minio-xxx.tar.gz -C /
docker-compose -f docker-compose.prod.yml restart minio
```

### Database Backup (Neon)
- **Automatic**: Neon provides automatic backups
- **Manual**: Use Neon dashboard for point-in-time recovery
- **Export**: `pg_dump` via connection string

## 📈 Scaling

### Scale Workers
```bash
# Scale to 5 instances
./deploy-prod.sh scale 5

# Or manually
docker-compose -f docker-compose.prod.yml up -d --scale workers=5
```

### Scale API (Multi-server)
Use Docker Swarm or Kubernetes for multi-server scaling

## 🔄 Update Application

```bash
# Automated update
./deploy-prod.sh update

# Manual update
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml exec api pnpm prisma migrate deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🛡️ Security Checklist

- [ ] Strong passwords (min 32 chars)
- [ ] Production Stripe keys
- [ ] SSL/TLS enabled (auto via Let's Encrypt)
- [ ] Basic auth for Traefik/Prometheus
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] OAuth apps configured
- [ ] Backups automated
- [ ] Monitoring alerts set up

## 💰 Cost Estimation

| Service | Cost |
|---------|------|
| Server (DigitalOcean 8GB) | $48/mo |
| Neon Postgres (Pro) | $19/mo |
| Domain | $1-2/mo |
| SendGrid (100k emails) | $15/mo |
| **Total Fixed** | **~$83/mo** |

Plus variable costs:
- OpenAI API (usage-based)
- Anthropic API (usage-based)
- Stripe (2.9% + $0.30)

## 📚 Documentation

- **Full Guide**: `PRODUCTION_DEPLOYMENT.md`
- **Environment Example**: `.env.production.example`
- **Deployment Script**: `deploy-prod.sh`

## 🆘 Support

- **GitHub**: https://github.com/yourusername/whalli/issues
- **Documentation**: `/apps/api/docs` and `/apps/web/docs`
- **Email**: support@mydomain.com

---

**Version**: 1.0.0  
**Last Updated**: October 5, 2025  
**Status**: ✅ Production Ready
