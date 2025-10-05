# =================================================================
# Whalli VPS Deployment Guide
# =================================================================

## Prerequisites

1. **VPS Requirements:**
   - Ubuntu 20.04+ or similar Linux distribution
   - Minimum 2GB RAM, 2 CPU cores
   - 20GB+ storage space
   - Docker and Docker Compose installed

2. **Domain Setup:**
   - Domain name pointing to your VPS IP
   - DNS A record: `yourdomain.com` -> `YOUR_VPS_IP`
   - DNS CNAME record: `*.yourdomain.com` -> `yourdomain.com`

## Quick Deployment

1. **Clone and Setup:**
   ```bash
   git clone <repository-url>
   cd whalli
   cp .env.example .env
   ```

2. **Configure Environment:**
   ```bash
   nano .env
   # Fill in your domain, email, and secure passwords
   ```

3. **Deploy:**
   ```bash
   chmod +x deploy.sh backup.sh
   ./deploy.sh
   ```

## Services and URLs

After deployment, your services will be available at:

- **Web App:** `https://web.yourdomain.com` (or `https://yourdomain.com`)
- **API:** `https://api.yourdomain.com`
- **Admin Panel:** `https://admin.yourdomain.com`
- **Traefik Dashboard:** `https://traefik.yourdomain.com`
- **MinIO Console:** `https://minio.yourdomain.com`
- **Storage API:** `https://storage.yourdomain.com`

## Environment Variables Guide

### Required Variables:
- `DOMAIN`: Your domain name (e.g., `example.com`)
- `ACME_EMAIL`: Email for Let's Encrypt certificates
- `POSTGRES_PASSWORD`: Secure password for PostgreSQL
- `REDIS_PASSWORD`: Secure password for Redis
- `JWT_SECRET`: Secret key for JWT tokens (generate with `openssl rand -base64 32`)
- `NEXTAUTH_SECRET`: Secret key for NextAuth (generate with `openssl rand -base64 32`)

### OAuth Setup (GitHub):
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App with:
   - Homepage URL: `https://web.yourdomain.com`
   - Authorization callback URL: `https://web.yourdomain.com/api/auth/callback/github`
3. Copy Client ID and Secret to `.env`

### Traefik Dashboard Authentication:
Generate password hash:
```bash
echo $(htpasswd -nb admin your-password) | sed -e s/\\$/\\$\\$/g
```

## Management Commands

```bash
# Deploy or update
./deploy.sh

# Update application
./deploy.sh update

# Stop all services
./deploy.sh stop

# Restart services
./deploy.sh restart

# View logs
./deploy.sh logs [service_name]

# Check service status
./deploy.sh status

# Create backup
./deploy.sh backup
```

## SSL Certificates

Let's Encrypt certificates are automatically generated and renewed by Traefik. The first certificate generation may take a few minutes.

## Backup and Restore

### Automatic Backups:
```bash
# Create backup
./backup.sh

# Backups are stored in ./backups/ directory
# Old backups (>7 days) are automatically cleaned up
```

### Manual Database Backup:
```bash
docker-compose exec postgres pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > backup.sql
```

### Restore Database:
```bash
docker-compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < backup.sql
```

## Monitoring and Logs

### View service logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f api
docker-compose logs -f postgres
```

### Check service health:
```bash
docker-compose ps
```

## Troubleshooting

### SSL Certificate Issues:
1. Ensure DNS is properly configured
2. Check Traefik logs: `docker-compose logs traefik`
3. Verify Let's Encrypt rate limits

### Database Connection Issues:
1. Check PostgreSQL health: `docker-compose exec postgres pg_isready`
2. Verify environment variables in `.env`
3. Check database logs: `docker-compose logs postgres`

### Application Not Starting:
1. Check build logs: `docker-compose logs [service]`
2. Verify all environment variables are set
3. Ensure dependencies are healthy: `./deploy.sh status`

## Security Recommendations

1. **Use Strong Passwords:** Generate secure passwords for all services
2. **Regular Updates:** Keep Docker images and host system updated
3. **Firewall:** Configure firewall to only allow ports 80, 443, and SSH
4. **Backup:** Set up automated backups to external storage
5. **Monitoring:** Consider adding monitoring solutions like Prometheus/Grafana
6. **Log Management:** Set up log rotation and centralized logging

## Performance Optimization

1. **Database:** Tune PostgreSQL settings based on available RAM
2. **Cache:** Monitor Redis memory usage
3. **Storage:** Use SSD storage for better performance
4. **CDN:** Consider using CloudFlare for static assets
5. **Scaling:** Use Docker Swarm or Kubernetes for horizontal scaling

## Maintenance

### Regular Tasks:
- Monitor disk space usage
- Check application logs for errors
- Update Docker images monthly
- Review and rotate secrets quarterly
- Test backup restoration process

### System Updates:
```bash
# Update host system
sudo apt update && sudo apt upgrade

# Update Docker images
docker-compose pull
./deploy.sh update
```