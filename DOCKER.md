# Docker Setup for Whalli

This document explains how to run Whalli using Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB of free RAM

## Quick Start (Development)

1. **Copy environment file:**
   ```bash
   cp .env.docker .env
   ```

2. **Generate JWT secrets:**
   ```bash
   openssl rand -base64 32  # For JWT_SECRET
   openssl rand -base64 32  # For JWT_REFRESH_SECRET
   ```

3. **Update `.env` file with your secrets and OpenAI API key**

4. **Start all services:**
   ```bash
   docker-compose up -d
   ```

5. **Run Prisma migrations:**
   ```bash
   docker-compose exec backend pnpm --filter @whalli/prisma migrate dev
   ```

6. **Access the applications:**
   - Backend API: http://localhost:4000
   - Frontend: http://localhost:4001
   - Admin Dashboard: http://localhost:4002

## Individual Service Commands

### Start specific services
```bash
docker-compose up -d postgres redis        # Only databases
docker-compose up -d backend              # Backend API
docker-compose up -d web                  # Frontend
```

### View logs
```bash
docker-compose logs -f                    # All services
docker-compose logs -f backend            # Backend only
docker-compose logs -f web                # Frontend only
```

### Stop services
```bash
docker-compose down                       # Stop all
docker-compose down -v                    # Stop and remove volumes
```

### Rebuild services
```bash
docker-compose up -d --build              # Rebuild all
docker-compose up -d --build backend      # Rebuild backend only
```

## Database Management

### Run migrations
```bash
docker-compose exec backend pnpm --filter @whalli/prisma migrate dev
```

### Access PostgreSQL
```bash
docker-compose exec postgres psql -U whalli -d whalli
```

### Backup database
```bash
docker-compose exec postgres pg_dump -U whalli whalli > backup.sql
```

### Restore database
```bash
docker-compose exec -T postgres psql -U whalli whalli < backup.sql
```

## Redis Management

### Access Redis CLI
```bash
docker-compose exec redis redis-cli
```

### Clear Redis cache
```bash
docker-compose exec redis redis-cli FLUSHALL
```

## Production Deployment

1. **Use production compose file:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Set strong passwords in production `.env`:**
   ```env
   POSTGRES_PASSWORD=strong-random-password
   REDIS_PASSWORD=another-strong-password
   JWT_SECRET=your-production-jwt-secret
   JWT_REFRESH_SECRET=your-production-refresh-secret
   ```

3. **Configure SSL certificates for Nginx**

4. **Run migrations:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend pnpm --filter @whalli/prisma migrate deploy
   ```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Check service status
docker-compose ps

# Restart services
docker-compose restart
```

### Database connection issues
```bash
# Verify PostgreSQL is healthy
docker-compose exec postgres pg_isready -U whalli

# Check database connectivity
docker-compose exec backend pnpm --filter @whalli/prisma studio
```

### Port conflicts
If ports are already in use, modify them in `.env`:
```env
POSTGRES_PORT=5433
REDIS_PORT=6380
BACKEND_PORT=4003
WEB_PORT=4004
ADMIN_PORT=4005
```

### Clean slate restart
```bash
# Stop and remove everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild and start
docker-compose up -d --build
```

## Performance Optimization

### Limit resource usage
Create `docker-compose.override.yml`:
```yaml
version: '3.8'

services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          memory: 512M

  web:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          memory: 256M
```

## Health Checks

All services include health checks. View status:
```bash
docker-compose ps
```

Services marked as "healthy" are ready to accept connections.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `DATABASE_URL` | PostgreSQL connection string | postgresql://whalli:whalli_dev_password@postgres:5432/whalli?schema=public |
| `POSTGRES_PORT` | PostgreSQL port (host) | 5432 |
| `REDIS_PORT` | Redis port | 6379 |
| `BACKEND_PORT` | Backend API external port | 4000 |
| `WEB_PORT` | Frontend external port | 4001 |
| `ADMIN_PORT` | Admin dashboard external port | 4002 |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | (required) |
| `OPENAI_API_KEY` | OpenAI API key | (required) |

## Network Architecture

```
┌─────────────┐
│   Nginx     │ :80, :443
└──────┬──────┘
       │
       ├──────────────────────┬──────────────────┐
       │                      │                  │
┌──────▼─────┐        ┌───────▼──────┐   ┌──────▼─────┐
│    Web     │        │    Admin     │   │  Backend   │
│ :4001->3000│        │ :4002->3000  │   │ :4000->3000│
└────────────┘        └──────────────┘   └──────┬─────┘
                                                │
                                    ┌───────────┼───────────┐
                                    │                       │
                             ┌──────▼──────┐        ┌──────▼─────┐
                             │  PostgreSQL │        │   Redis    │
                             │    :5432    │        │   :6379    │
                             └─────────────┘        └────────────┘
```

## Support

For issues related to Docker setup, check:
- Docker logs: `docker-compose logs`
- Service status: `docker-compose ps`
- Container inspection: `docker inspect <container_name>`
