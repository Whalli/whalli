# GitHub Secrets Setup Checklist

Quick reference for configuring all required GitHub Actions secrets for automated deployment.

## 🔐 How to Add Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Copy the secret name and value
5. Click **Add secret**

## ✅ Required Secrets Checklist

### Server Access (3 secrets)

- [ ] **SSH_PRIVATE_KEY**
  - Description: Private SSH key for server access
  - How to get:
    ```bash
    ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy_key
    cat ~/.ssh/github_deploy_key
    # Copy entire output including BEGIN/END lines
    ```
  - Format: Multiline text with `-----BEGIN OPENSSH PRIVATE KEY-----`

- [ ] **SERVER_HOST**
  - Description: Production server IP or hostname
  - Example: `123.45.67.89` or `server.mydomain.com`
  - Format: Single line

- [ ] **SERVER_USER**
  - Description: SSH username for deployment
  - Example: `ubuntu`, `root`, `deploy`
  - Format: Single line

---

### Database (1 secret)

- [ ] **DATABASE_URL**
  - Description: Neon Postgres connection string
  - How to get: https://console.neon.tech/ → Your Project → Connection String
  - Format: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require`
  - **Important**: Must include `?sslmode=require` at the end
  - Example:
    ```
    postgresql://neondb_owner:AbCdEf123456@ep-cool-morning-12345678.us-east-2.aws.neon.tech/neondb?sslmode=require
    ```

---

### Application Secrets (4 secrets)

- [ ] **REDIS_URL**
  - Description: Redis connection URL
  - Format: `redis://:password@redis:6379/0`
  - Example: `redis://:abc123xyz@redis:6379/0`
  - Note: Use same password as REDIS_PASSWORD

- [ ] **REDIS_PASSWORD**
  - Description: Redis password for caching
  - How to generate: `openssl rand -base64 32`
  - Format: 32+ character random string

- [ ] **JWT_SECRET**
  - Description: JWT token signing secret
  - How to generate: `openssl rand -base64 32`
  - Format: 32+ character random string

- [ ] **BETTER_AUTH_SECRET**
  - Description: Better Auth library secret
  - How to generate: `openssl rand -base64 32`
  - Format: 32+ character random string

---

### Stripe (3 secrets)

- [ ] **STRIPE_SECRET_KEY**
  - Description: Stripe API secret key (backend)
  - How to get: https://dashboard.stripe.com/apikeys
  - Format: Starts with `sk_live_` (production) or `sk_test_` (development)
  - Example: `sk_live_51A...`

- [ ] **STRIPE_WEBHOOK_SECRET**
  - Description: Stripe webhook signing secret
  - How to get: https://dashboard.stripe.com/webhooks → Add endpoint
  - Format: Starts with `whsec_`
  - Example: `whsec_abc123...`

- [ ] **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
  - Description: Stripe publishable key (frontend)
  - How to get: https://dashboard.stripe.com/apikeys
  - Format: Starts with `pk_live_` or `pk_test_`
  - Example: `pk_live_51A...`

---

### AI Providers (3 secrets)

- [ ] **OPENAI_API_KEY**
  - Description: OpenAI API key (GPT-4, GPT-3.5)
  - How to get: https://platform.openai.com/api-keys
  - Format: Starts with `sk-`
  - Example: `sk-abc123...`

- [ ] **ANTHROPIC_API_KEY**
  - Description: Anthropic API key (Claude)
  - How to get: https://console.anthropic.com/settings/keys
  - Format: Starts with `sk-ant-`
  - Example: `sk-ant-api03-...`

- [ ] **XAI_API_KEY**
  - Description: xAI API key (Grok)
  - How to get: https://console.x.ai/
  - Format: Starts with `xai-`
  - Example: `xai-abc123...`

---

### MinIO (4 secrets)

- [ ] **MINIO_ROOT_USER**
  - Description: MinIO admin username
  - Default: `minioadmin`
  - Recommendation: Use custom username for security
  - Format: Alphanumeric string

- [ ] **MINIO_ROOT_PASSWORD**
  - Description: MinIO admin password
  - How to generate: `openssl rand -base64 32`
  - Format: 32+ character random string

- [ ] **MINIO_ACCESS_KEY**
  - Description: MinIO S3-compatible access key (for application access)
  - How to generate: `openssl rand -hex 20`
  - Format: 40-character hex string
  - Note: Different from MINIO_ROOT_USER (this is for API access)

- [ ] **MINIO_SECRET_KEY**
  - Description: MinIO S3-compatible secret key (for application access)
  - How to generate: `openssl rand -base64 32`
  - Format: 32+ character random string
  - Note: Pair with MINIO_ACCESS_KEY

---

### Monitoring (1 secret)

- [ ] **GRAFANA_ADMIN_PASSWORD**
  - Description: Grafana admin user password
  - How to generate: `openssl rand -base64 32`
  - Recommendation: Use strong password (32+ chars)
  - Format: Alphanumeric string

---

### Domain Configuration (2 secrets)

- [ ] **DOMAIN**
  - Description: Your production domain name
  - Example: `mydomain.com` (without https://)
  - Format: Domain only (no protocol, no www)

- [ ] **ACME_EMAIL**
  - Description: Email for Let's Encrypt SSL certificate notifications
  - Example: `admin@mydomain.com`
  - Format: Valid email address

---

## 📊 Summary

**Total Secrets Required**: 21

| Category | Count |
|----------|-------|
| Server Access | 3 |
| Database | 1 |
| Application | 4 |
| Stripe | 3 |
| AI Providers | 3 |
| MinIO | 4 |
| Monitoring | 1 |
| Domain | 2 |

## 🔧 Quick Generation Commands

Copy-paste these commands to generate secure secrets:

```bash
# Generate multiple secrets at once
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"
echo "MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)"
echo "MINIO_ACCESS_KEY=$(openssl rand -hex 20)"
echo "MINIO_SECRET_KEY=$(openssl rand -base64 32)"
echo "GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 32)"

# Generate REDIS_URL (replace PASSWORD with your REDIS_PASSWORD)
echo "REDIS_URL=redis://:PASSWORD@redis:6379/0"

# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# Display private key (add to SSH_PRIVATE_KEY secret)
cat ~/.ssh/github_deploy_key

# Display public key (add to server's authorized_keys)
cat ~/.ssh/github_deploy_key.pub
```

## 🧪 Verification

After adding all secrets, verify they're set:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Check that all 18 secrets are listed
3. Verify secret names match exactly (case-sensitive)

## 🚀 Test Deployment

Once all secrets are configured:

1. Go to **Actions** tab
2. Click **Production Deployment** workflow
3. Click **Run workflow**
4. Select `production` environment
5. Click **Run workflow** button
6. Monitor logs for any errors

## ⚠️ Common Mistakes

### 1. Missing `?sslmode=require` in DATABASE_URL
```
❌ postgresql://user:pass@ep-xxx.neon.tech/db
✅ postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require
```

### 2. Including protocol in DOMAIN
```
❌ https://mydomain.com
❌ www.mydomain.com
✅ mydomain.com
```

### 3. Wrong SSH key format
```
❌ Only the key content (without BEGIN/END lines)
✅ Full key including:
-----BEGIN OPENSSH PRIVATE KEY-----
...key content...
-----END OPENSSH PRIVATE KEY-----
```

### 4. Test keys in production
```
❌ sk_test_... (Stripe test key)
❌ pk_test_... (Stripe test publishable key)
✅ sk_live_... (Stripe live key)
✅ pk_live_... (Stripe live publishable key)
```

## 🔐 Security Tips

1. **Never commit secrets to repository**
2. **Rotate secrets regularly** (every 90 days)
3. **Use different secrets for staging/production**
4. **Limit SSH key access** (dedicated deploy user)
5. **Enable 2FA on all provider accounts**

## 📚 Related Documentation

- **Complete Setup Guide**: `GITHUB_ACTIONS_DEPLOYMENT.md`
- **Database Configuration**: `apps/api/DATABASE_CONFIG.md`
- **Production Deployment**: `PRODUCTION_DEPLOYMENT.md`

---

**Status**: ✅ Ready to Use  
**Last Updated**: October 5, 2025  
**Maintainer**: Whalli Team
