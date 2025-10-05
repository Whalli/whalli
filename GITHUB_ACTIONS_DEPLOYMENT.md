# GitHub Actions Deployment Guide

Complete guide for setting up automated deployments with GitHub Actions, including Prisma migrations against Neon Postgres.

## 📋 Overview

The deployment workflow (`deploy.yml`) automates:
1. ✅ Code checkout and deployment
2. ✅ Environment variable configuration
3. ✅ Docker image building
4. ✅ Service startup
5. ✅ **Prisma database migrations** (Neon Postgres)
6. ✅ Health checks and verification
7. ✅ Automatic rollback on failure

## 🔐 Required GitHub Secrets

**Total**: 21 secrets required for production deployment

### Setup Secrets in GitHub

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below:

### Server Access Secrets

```
SSH_PRIVATE_KEY       - Private SSH key for server access
SERVER_HOST           - Server hostname or IP (e.g., 123.45.67.89)
SERVER_USER           - SSH username (e.g., ubuntu, root)
```

#### Generating SSH Key

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_deploy_key.pub user@your-server

# Copy private key to GitHub Secrets
cat ~/.ssh/github_deploy_key
# Copy entire output (including BEGIN/END lines) to SSH_PRIVATE_KEY secret
```

### Database Secrets

```
DATABASE_URL          - Neon Postgres connection string
                       Format: postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require
                       Get from: https://console.neon.tech/
```

**Example**:
```
postgresql://neondb_owner:AbCdEf123456@ep-cool-morning-12345678.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Application Secrets

```
REDIS_URL            - Redis connection URL
                       Format: redis://:password@redis:6379/0
                       Example: redis://:abc123xyz@redis:6379/0
REDIS_PASSWORD        - Redis password (generate: openssl rand -base64 32)
JWT_SECRET           - JWT signing secret (generate: openssl rand -base64 32)
BETTER_AUTH_SECRET   - Better Auth secret (generate: openssl rand -base64 32)
```

### Stripe Secrets

```
STRIPE_SECRET_KEY         - Stripe secret key (sk_live_...)
STRIPE_WEBHOOK_SECRET     - Stripe webhook secret (whsec_...)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - Stripe publishable key (pk_live_...)
```

Get from: https://dashboard.stripe.com/apikeys

### AI Provider Secrets

```
OPENAI_API_KEY       - OpenAI API key (sk-...)
ANTHROPIC_API_KEY    - Anthropic API key (sk-ant-...)
XAI_API_KEY          - xAI/Grok API key (xai-...)
```

### MinIO Secrets

```
MINIO_ROOT_USER      - MinIO admin username (default: minioadmin)
MINIO_ROOT_PASSWORD  - MinIO admin password (generate: openssl rand -base64 32)
MINIO_ACCESS_KEY     - MinIO S3 access key (generate: openssl rand -hex 20)
MINIO_SECRET_KEY     - MinIO S3 secret key (generate: openssl rand -base64 32)
```

**Note**: `MINIO_ROOT_USER/PASSWORD` are for admin console access, while `MINIO_ACCESS_KEY/SECRET_KEY` are for S3 API access from your applications.

### Monitoring Secrets

```
GRAFANA_ADMIN_PASSWORD - Grafana admin password
```

### Domain Configuration

```
DOMAIN               - Your domain (e.g., mydomain.com)
ACME_EMAIL          - Email for Let's Encrypt (e.g., admin@mydomain.com)
```

## 🚀 Workflow Overview

### Workflow File Structure

```yaml
.github/workflows/
├── ci-cd.yml       # CI/CD pipeline (lint, test, build, Docker)
└── deploy.yml      # Production deployment (NEW)
```

### Deploy Workflow Triggers

The workflow triggers on:
1. **Push to main branch**: Automatic deployment
2. **Manual dispatch**: Deploy on-demand via GitHub UI

### Deployment Steps

```
1. Checkout Code
   └─> Pull latest code from main branch

2. Setup SSH
   └─> Configure SSH agent with private key

3. Deploy to Server
   ├─> Pull latest code on server
   ├─> Create .env file with secrets
   ├─> Build Docker images
   ├─> Start services (docker-compose up -d)
   ├─> Wait for services (30s)
   ├─> Run Prisma migrations ⭐ NEW
   └─> Verify deployment

4. Verify Deployment
   └─> Check API health endpoint

5. Notify Results
   └─> Success or failure notification

6. Rollback (on failure)
   └─> Revert to previous version
```

## 🗄️ Prisma Migration Step

### How It Works

```yaml
echo "🗄️ Running Prisma migrations..."
docker-compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy
```

**What happens**:
1. Connects to API container
2. Runs `prisma migrate deploy` command
3. Applies all pending migrations to Neon Postgres
4. Uses `DATABASE_URL` from environment variables
5. Exits with error if migration fails

### Migration Command Breakdown

```bash
docker-compose -f docker-compose.prod.yml  # Use production compose file
  exec -T                                   # Execute in container (non-interactive)
  api                                       # Target API service
  npx prisma migrate deploy                 # Run migrations
```

**Flags**:
- `-T`: Disable TTY allocation (required for CI/CD)
- `exec`: Execute command in running container
- `migrate deploy`: Apply migrations (production-safe)

### Why `migrate deploy` (not `migrate dev`)

| Command | Purpose | Use Case |
|---------|---------|----------|
| `migrate dev` | Development | Creates + applies migrations, updates schema |
| `migrate deploy` | Production | Only applies existing migrations (safe) |

**`migrate deploy`**:
- ✅ Only runs migrations from `/prisma/migrations/`
- ✅ Doesn't create new migrations
- ✅ Safe for production
- ✅ Idempotent (can run multiple times)
- ✅ Exits with error if pending migrations missing

## 📊 Workflow Execution Flow

### Success Flow

```
GitHub Push → Trigger Workflow
    ↓
Checkout Code
    ↓
SSH to Server
    ↓
Pull Latest Code
    ↓
Create .env with Secrets
    ↓
Build Docker Images
    ↓
Start Services (docker-compose up -d)
    ↓
Wait 30s
    ↓
Run Prisma Migrations ⭐
    ↓
Verify Health Check
    ↓
✅ Success Notification
```

### Failure Flow (with Rollback)

```
GitHub Push → Trigger Workflow
    ↓
... (same steps) ...
    ↓
❌ Migration or Health Check Fails
    ↓
Trigger Rollback
    ↓
Revert Code (git reset --hard HEAD~1)
    ↓
Restart Services
    ↓
❌ Failure Notification
```

## 🔧 Manual Deployment

### Via GitHub UI

1. Go to **Actions** tab in your repository
2. Click **Production Deployment** workflow
3. Click **Run workflow** button
4. Select environment (production/staging)
5. Click **Run workflow**

### Via GitHub CLI

```bash
# Install GitHub CLI
brew install gh  # macOS
# or: sudo apt install gh  # Linux

# Authenticate
gh auth login

# Trigger deployment
gh workflow run deploy.yml -f environment=production
```

## 🐛 Troubleshooting

### Issue 1: SSH Connection Failed

**Error**: `Permission denied (publickey)`

**Solutions**:
```bash
# Verify SSH key is correct
ssh -i ~/.ssh/github_deploy_key user@server

# Check SSH_PRIVATE_KEY secret format
# Should include:
-----BEGIN OPENSSH PRIVATE KEY-----
...key content...
-----END OPENSSH PRIVATE KEY-----

# Ensure public key is in server's authorized_keys
cat ~/.ssh/github_deploy_key.pub | ssh user@server 'cat >> ~/.ssh/authorized_keys'
```

### Issue 2: Prisma Migration Failed

**Error**: `Migration failed: Connection refused`

**Check**:
1. Verify `DATABASE_URL` secret is correct
2. Check Neon Postgres is not paused (free tier auto-pauses)
3. Verify `?sslmode=require` is in connection string

**Test connection**:
```bash
# SSH to server
ssh user@server

# Test database connection
docker-compose -f docker-compose.prod.yml exec api npx prisma db pull

# Check API logs
docker-compose -f docker-compose.prod.yml logs api
```

### Issue 3: Services Not Starting

**Error**: `Service 'api' didn't start`

**Check**:
```bash
# SSH to server
ssh user@server

# Check Docker logs
docker-compose -f docker-compose.prod.yml logs

# Check service status
docker-compose -f docker-compose.prod.yml ps

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Issue 4: Health Check Failed

**Error**: `API health check failed`

**Check**:
```bash
# SSH to server
ssh user@server

# Check API health locally
curl http://localhost:3001/api/health

# Check API logs
docker-compose -f docker-compose.prod.yml logs api

# Check database connection
docker-compose -f docker-compose.prod.yml exec api npx prisma db pull
```

### Issue 5: Environment Variables Not Loading

**Error**: `Environment variable not found`

**Solutions**:
1. Verify all secrets are set in GitHub repository settings
2. Check `.env` file is created on server: `cat /opt/whalli/.env`
3. Restart services: `docker-compose -f docker-compose.prod.yml restart`

## 📝 Testing Deployment Workflow

### 1. Local Testing (Recommended)

Test deployment script locally before running in CI:

```bash
# On your local machine
cd /opt/whalli

# Create test .env
cp .env.production.example .env
nano .env  # Fill in values

# Test build
docker-compose -f docker-compose.prod.yml build

# Test services
docker-compose -f docker-compose.prod.yml up -d

# Test migrations
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Test health
curl http://localhost:3001/api/health
```

### 2. Dry Run on Server

SSH to server and run deployment steps manually:

```bash
# SSH to server
ssh user@server

# Navigate to project
cd /opt/whalli

# Pull latest code
git pull origin main

# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Wait for services
sleep 30

# Run migrations
docker-compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy

# Check health
curl http://localhost:3001/api/health
```

### 3. Test Workflow (Without Deployment)

Create a test branch and push:

```bash
# Create test branch
git checkout -b test-deployment

# Push to trigger CI (not deployment)
git push origin test-deployment
```

## 🔐 Security Best Practices

### 1. Rotate Secrets Regularly

```bash
# Generate new secrets
openssl rand -base64 32

# Update in GitHub Secrets
# Update on server
# Restart services
```

### 2. Use Separate Environments

```yaml
# In deploy.yml
environment: ${{ github.event.inputs.environment || 'production' }}

# Create staging environment secrets
STAGING_DATABASE_URL
STAGING_SERVER_HOST
# etc.
```

### 3. Limit SSH Access

```bash
# On server, create dedicated deploy user
sudo useradd -m -s /bin/bash github-deploy

# Add to docker group
sudo usermod -aG docker github-deploy

# Set up SSH key
sudo -u github-deploy mkdir -p /home/github-deploy/.ssh
sudo -u github-deploy cat > /home/github-deploy/.ssh/authorized_keys << EOF
<public key>
EOF

# Restrict permissions
sudo chmod 700 /home/github-deploy/.ssh
sudo chmod 600 /home/github-deploy/.ssh/authorized_keys
```

### 4. Enable GitHub Actions Logs

Keep deployment logs for auditing:
- GitHub Actions logs are retained for 90 days
- Download logs for long-term storage
- Enable branch protection rules

## 📊 Monitoring Deployments

### GitHub Actions Dashboard

1. Go to **Actions** tab
2. View workflow runs
3. Click on run for detailed logs
4. Download logs for analysis

### Server Monitoring

```bash
# SSH to server
ssh user@server

# Check deployment status
cd /opt/whalli
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check resource usage
docker stats

# Check disk space
df -h
```

### Grafana Monitoring

After deployment, check Grafana:
- URL: https://grafana.yourdomain.com
- Dashboards show deployment impact
- Monitor request rates, errors, latency

## 🎯 Example Secrets Configuration

### Complete Secrets List

```
# Server Access
SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
SERVER_HOST=123.45.67.89
SERVER_USER=ubuntu

# Database
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require

# Application
REDIS_URL=redis://:abc123xyz@redis:6379/0
REDIS_PASSWORD=abc123...
JWT_SECRET=xyz789...
BETTER_AUTH_SECRET=def456...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=secure123...
MINIO_ACCESS_KEY=abcdef0123456789abcd
MINIO_SECRET_KEY=secure789...

# Monitoring
GRAFANA_ADMIN_PASSWORD=secure456...

# Domain
DOMAIN=mydomain.com
ACME_EMAIL=admin@mydomain.com
```

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All GitHub secrets configured
- [ ] SSH key set up and tested
- [ ] Server has Docker and Docker Compose installed
- [ ] Domain DNS configured
- [ ] Neon Postgres database created
- [ ] All migrations committed to repository
- [ ] Test deployment on staging environment

### During Deployment

- [ ] Monitor GitHub Actions logs
- [ ] Watch for migration errors
- [ ] Check service health endpoints
- [ ] Verify SSL certificates generated

### Post-Deployment

- [ ] Test API endpoints
- [ ] Test web application
- [ ] Check Grafana dashboards
- [ ] Verify database migrations applied
- [ ] Test critical user flows
- [ ] Monitor error logs for 1 hour

## 📚 Related Documentation

- **Deployment Guide**: `PRODUCTION_DEPLOYMENT.md`
- **Database Config**: `apps/api/DATABASE_CONFIG.md`
- **Docker Compose**: `docker-compose.prod.yml`
- **Deploy Script**: `deploy-prod.sh`

## 🆘 Support

### GitHub Actions Errors

Check logs in:
1. GitHub Actions tab → Click failed run → View details
2. Server logs: `ssh user@server 'docker-compose -f /opt/whalli/docker-compose.prod.yml logs'`

### Migration Errors

Check Prisma logs:
```bash
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate status
```

### Rollback Procedure

```bash
# SSH to server
ssh user@server
cd /opt/whalli

# Revert to previous commit
git log --oneline -10  # Find previous commit
git reset --hard <commit-hash>

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

---

**Version**: 1.0.0  
**Last Updated**: October 5, 2025  
**Status**: ✅ Production Ready  
**Maintainer**: Whalli Team
