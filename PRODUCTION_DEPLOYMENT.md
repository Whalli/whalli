# Production Deployment Guide - Whalli

This guide covers deploying Whalli to production using Docker Compose with external Neon Postgres database.

## Architecture Overview

### Services
- **Web** (Next.js) - Main application at `app.mydomain.com`
- **API** (NestJS) - Backend API at `api.mydomain.com`
- **Admin** (Next.js) - Admin panel at `admin.mydomain.com`
- **Workers** (BullMQ) - Background job processors
- **Redis** - Cache and queue storage
- **MinIO** - S3-compatible file storage
- **Traefik** - Reverse proxy with automatic SSL
- **Prometheus** - Metrics collection at `prometheus.mydomain.com`
- **Grafana** - Metrics visualization at `grafana.mydomain.com`

### External Services
- **Neon Postgres** - Managed PostgreSQL database (serverless)

---

## Prerequisites

### 1. Server Requirements
- **OS**: Linux (Ubuntu 22.04 LTS recommended)
- **RAM**: Minimum 4GB (8GB+ recommended)
- **CPU**: 2+ cores
- **Storage**: 20GB+ free space
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+

### 2. Domain Setup
Point your domain's DNS records to your server IP:
```
A    mydomain.com           -> YOUR_SERVER_IP
A    *.mydomain.com         -> YOUR_SERVER_IP (wildcard)
```

Or individual subdomains:
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

### 3. Neon Postgres Setup

1. **Create Neon Account**
   - Visit: https://neon.tech/
   - Sign up for free account

2. **Create Project**
   - Click "Create Project"
   - Choose region closest to your server
   - Note down connection string

3. **Get Connection String**
   - Format: `postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require`
   - Copy this to your `.env` file as `DATABASE_URL`

4. **Configure Connection Pooling** (Optional but recommended)
   - Enable connection pooling in Neon dashboard
   - Use pooled connection string for API/Workers

---

## Step-by-Step Deployment

### Step 1: Clone Repository

```bash
cd /opt
sudo git clone https://github.com/yourusername/whalli.git
cd whalli
```

### Step 2: Configure Environment Variables

```bash
# Copy example env file
cp .env.production.example .env

# Edit with your values
nano .env
```

**Required Variables:**
```env
# Domain
DOMAIN=mydomain.com
ACME_EMAIL=admin@mydomain.com

# Neon Postgres
DATABASE_URL=postgresql://user:password@ep-xxxx.region.aws.neon.tech/whalli?sslmode=require

# Redis
REDIS_PASSWORD=generate-with-openssl-rand-base64-32

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=generate-secure-password
MINIO_BUCKET=whalli-uploads

# Auth Secrets
JWT_SECRET=generate-with-openssl-rand-base64-32
BETTER_AUTH_SECRET=generate-with-openssl-rand-base64-32

# Stripe (production keys)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# AI Providers
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
XAI_API_KEY=xai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=noreply@mydomain.com

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=generate-secure-password

# Basic Auth (generate with htpasswd)
TRAEFIK_AUTH=admin:$$apr1$$xxxxxxxxxxxxxxxxxxxx
PROMETHEUS_AUTH=admin:$$apr1$$xxxxxxxxxxxxxxxxxxxx
```

### Step 3: Generate Secrets

```bash
# Generate JWT and auth secrets
openssl rand -base64 32

# Generate Basic Auth for Traefik/Prometheus
htpasswd -nb admin your-password
# Copy output and escape $ with $$ for docker-compose
```

### Step 4: Run Database Migrations

Before starting services, run migrations against Neon database:

```bash
# Install dependencies
pnpm install

# Generate Prisma client
cd apps/api
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Verify connection
pnpm prisma db pull
```

### Step 5: Build and Start Services

```bash
# Return to root
cd /opt/whalli

# Build images (first time)
docker-compose -f docker-compose.prod.yml build

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### Step 6: Verify Deployment

**Health Checks:**
```bash
# API health
curl https://api.mydomain.com/api/health

# Web app
curl https://app.mydomain.com

# Admin panel
curl https://admin.mydomain.com

# Prometheus
curl -u admin:your-password https://prometheus.mydomain.com/-/healthy

# Grafana
curl https://grafana.mydomain.com/api/health
```

**Service URLs:**
- **Web App**: https://app.mydomain.com
- **API**: https://api.mydomain.com
- **Admin**: https://admin.mydomain.com
- **Grafana**: https://grafana.mydomain.com
- **Prometheus**: https://prometheus.mydomain.com (requires auth)
- **MinIO Console**: https://minio.mydomain.com
- **Traefik Dashboard**: https://traefik.mydomain.com (requires auth)

### Step 7: Configure Stripe Webhooks

1. **Login to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com/webhooks

2. **Add Endpoint**
   - URL: `https://api.mydomain.com/api/billing/webhook`
   - Events to send:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. **Copy Webhook Secret**
   - Update `STRIPE_WEBHOOK_SECRET` in `.env`
   - Restart API: `docker-compose -f docker-compose.prod.yml restart api`

### Step 8: Configure OAuth Apps

**GitHub OAuth:**
1. Visit: https://github.com/settings/developers
2. Create OAuth App
3. Callback URLs:
   - `https://app.mydomain.com/api/auth/callback/github`
   - `https://admin.mydomain.com/api/auth/callback/github`
4. Copy Client ID and Secret to `.env`

**Google OAuth:**
1. Visit: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Authorized redirect URIs:
   - `https://app.mydomain.com/api/auth/callback/google`
   - `https://admin.mydomain.com/api/auth/callback/google`
4. Copy Client ID and Secret to `.env`

**Restart services after OAuth configuration:**
```bash
docker-compose -f docker-compose.prod.yml restart web admin
```

---

## Management Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f workers
docker-compose -f docker-compose.prod.yml logs -f web
```

### Restart Services
```bash
# All services
docker-compose -f docker-compose.prod.yml restart

# Specific service
docker-compose -f docker-compose.prod.yml restart api
docker-compose -f docker-compose.prod.yml restart workers
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run new migrations
docker-compose -f docker-compose.prod.yml exec api pnpm prisma migrate deploy
```

### Scale Workers
```bash
# Scale to 3 worker instances
docker-compose -f docker-compose.prod.yml up -d --scale workers=3
```

### Database Operations
```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec api pnpm prisma migrate deploy

# Open Prisma Studio (read-only in production)
docker-compose -f docker-compose.prod.yml exec api pnpm prisma studio

# Generate Prisma client
docker-compose -f docker-compose.prod.yml exec api pnpm prisma generate

# Database backup (using pg_dump via Neon)
# Download from Neon dashboard or use neon CLI
```

### Stop Services
```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes (DESTRUCTIVE - loses Redis/MinIO data)
docker-compose -f docker-compose.prod.yml down -v
```

---

## Monitoring

### Grafana Dashboard
1. Visit: https://grafana.mydomain.com
2. Login: `admin` / `your-grafana-password`
3. Add Prometheus data source (auto-configured)
4. Import dashboards:
   - Node Exporter (ID: 1860)
   - Docker (ID: 893)
   - Redis (ID: 763)

### Prometheus Metrics
- Visit: https://prometheus.mydomain.com
- Login: `admin` / `your-password`
- Available metrics:
  - `http_requests_total` - Total HTTP requests
  - `http_request_duration_seconds` - Request latency
  - `ai_model_requests_total` - AI model usage
  - `cache_hit_rate` - Redis cache performance
  - `active_connections` - WebSocket connections

### Application Logs
```bash
# API logs
docker-compose -f docker-compose.prod.yml exec api tail -f /app/logs/combined.log

# Worker logs
docker-compose -f docker-compose.prod.yml logs -f workers

# Traefik access logs
docker-compose -f docker-compose.prod.yml logs -f traefik
```

---

## Security Checklist

- [ ] Use strong passwords for all services (min 32 characters)
- [ ] Enable Traefik basic auth for dashboard
- [ ] Configure Prometheus basic auth
- [ ] Use production Stripe keys (not test keys)
- [ ] Enable SSL/TLS for all services (auto via Let's Encrypt)
- [ ] Restrict MinIO console access (behind auth)
- [ ] Configure firewall (UFW):
  ```bash
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw enable
  ```
- [ ] Set up automated backups for volumes
- [ ] Configure rate limiting (already enabled in API)
- [ ] Review CORS settings in Traefik labels
- [ ] Enable GitHub/Google OAuth (not just email/password)
- [ ] Set up monitoring alerts in Grafana

---

## Backup Strategy

### 1. Neon Postgres
- **Automatic**: Neon provides automatic backups
- **Manual**: Use Neon dashboard or CLI for point-in-time recovery
- **Export**: `pg_dump` via Neon connection string

### 2. Redis Data
```bash
# Backup Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli \
  --pass ${REDIS_PASSWORD} --rdb /data/backup.rdb

# Copy backup
docker cp whalli-redis-prod:/data/backup.rdb ./backups/
```

### 3. MinIO Files
```bash
# Backup MinIO data
docker run --rm -v whalli_minio-data:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/minio-backup-$(date +%Y%m%d).tar.gz /data
```

### 4. Automated Backup Script
Create `/opt/whalli/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup Redis
docker-compose -f docker-compose.prod.yml exec -T redis \
  redis-cli --pass $REDIS_PASSWORD --rdb /data/dump.rdb
docker cp whalli-redis-prod:/data/dump.rdb $BACKUP_DIR/redis-$DATE.rdb

# Backup MinIO
docker run --rm -v whalli_minio-data:/data -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/minio-$DATE.tar.gz /data

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Add to crontab:
```bash
# Run daily at 2 AM
0 2 * * * /opt/whalli/backup.sh >> /var/log/whalli-backup.log 2>&1
```

---

## Troubleshooting

### Issue: Let's Encrypt Rate Limit
**Symptom**: SSL certificate not generating
**Solution**: 
- Use staging environment first: `--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory`
- Wait 1 week for rate limit reset
- Use wildcard certificate

### Issue: API Can't Connect to Neon
**Symptom**: `ECONNREFUSED` or timeout errors
**Solution**:
- Verify DATABASE_URL is correct
- Check Neon dashboard for connection string
- Ensure `?sslmode=require` is in connection string
- Verify firewall allows outbound connections

### Issue: Redis Connection Failed
**Symptom**: `NOAUTH Authentication required`
**Solution**:
- Check REDIS_PASSWORD in `.env`
- Verify Redis container is running
- Restart API: `docker-compose -f docker-compose.prod.yml restart api`

### Issue: MinIO Uploads Failing
**Symptom**: `Access Denied` or `NoSuchBucket`
**Solution**:
- Check MINIO_ROOT_USER and MINIO_ROOT_PASSWORD
- Create bucket manually via MinIO console
- Verify MINIO_BUCKET environment variable

### Issue: Workers Not Processing Jobs
**Symptom**: Jobs stuck in queue
**Solution**:
- Check worker logs: `docker-compose -f docker-compose.prod.yml logs -f workers`
- Verify Redis connection
- Restart workers: `docker-compose -f docker-compose.prod.yml restart workers`
- Scale workers: `--scale workers=3`

---

## Performance Optimization

### 1. Database Connection Pooling
Use Neon's pooled connection string:
```env
# Pooled connection (recommended for API with many connections)
DATABASE_URL=postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/whalli?sslmode=require

# Direct connection (recommended for migrations/Prisma Studio)
DIRECT_DATABASE_URL=postgresql://user:password@ep-xxxx.region.aws.neon.tech/whalli?sslmode=require
```

### 2. Redis Persistence
Edit `docker-compose.prod.yml` Redis command:
```yaml
command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD} --save 60 1000
```

### 3. Traefik Compression
Add to Traefik labels:
```yaml
- traefik.http.middlewares.compress.compress=true
- traefik.http.routers.api.middlewares=api-cors,compress
```

### 4. Scale Workers
```bash
# Scale to match CPU cores
docker-compose -f docker-compose.prod.yml up -d --scale workers=4
```

---

## Cost Estimation

### Monthly Costs (USD)

| Service | Provider | Cost |
|---------|----------|------|
| **Server** | DigitalOcean (8GB RAM, 4 vCPUs) | $48 |
| **Neon Postgres** | Neon.tech (Pro Plan) | $19 |
| **Domain** | Namecheap/GoDaddy | $1-2 |
| **OpenAI API** | OpenAI (usage-based) | Variable |
| **Anthropic API** | Anthropic (usage-based) | Variable |
| **Stripe** | 2.9% + $0.30 per transaction | Variable |
| **Email** | SendGrid (100k emails/month) | $15 |
| **Total Fixed** | | **~$83/month** |

**Notes:**
- SSL certificates: Free (Let's Encrypt)
- Redis/MinIO: Self-hosted (included in server cost)
- AI API costs scale with usage
- Can start with free tiers for testing

---

## Production Checklist

- [ ] Server provisioned and secured
- [ ] Domain DNS configured
- [ ] Neon Postgres database created
- [ ] `.env` file configured with all secrets
- [ ] OAuth apps configured (GitHub, Google)
- [ ] Stripe webhooks configured
- [ ] SSL certificates generated (auto via Let's Encrypt)
- [ ] Database migrations applied
- [ ] All services running and healthy
- [ ] Health endpoints responding
- [ ] Grafana dashboards configured
- [ ] Backup script scheduled
- [ ] Firewall configured
- [ ] Monitoring alerts set up
- [ ] Error tracking configured (optional: Sentry)
- [ ] Load testing completed
- [ ] Security audit completed

---

## Support

For issues or questions:
- **Documentation**: `/apps/api/docs` and `/apps/web/docs`
- **GitHub Issues**: https://github.com/yourusername/whalli/issues
- **Email**: support@mydomain.com

---

**Version**: 1.0.0  
**Last Updated**: October 5, 2025  
**Maintainer**: Whalli Team
