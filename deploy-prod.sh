#!/bin/bash

# Production Deployment Script for Whalli
# Version: 1.0.0
# Usage: ./deploy-prod.sh [command]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_env_file() {
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        print_info "Copy .env.production.example to .env and configure it:"
        echo "  cp .env.production.example .env"
        echo "  nano .env"
        exit 1
    fi
    print_success ".env file found"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed!"
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

check_database_url() {
    source .env
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL is not set in .env file!"
        exit 1
    fi
    
    if [[ $DATABASE_URL == *"localhost"* ]] || [[ $DATABASE_URL == *"postgres:5432"* ]]; then
        print_warning "DATABASE_URL points to localhost. For production, use Neon Postgres!"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    print_success "DATABASE_URL is configured"
}

generate_secrets() {
    print_info "Generating secure secrets..."
    
    echo ""
    echo "=== Copy these to your .env file ==="
    echo ""
    
    echo "JWT_SECRET=$(openssl rand -base64 32)"
    echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"
    echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
    echo "MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)"
    echo "GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 16)"
    
    echo ""
    echo "=== Generate Basic Auth (install apache2-utils first) ==="
    echo ""
    
    if command -v htpasswd &> /dev/null; then
        read -p "Enter username for Traefik/Prometheus: " username
        read -s -p "Enter password: " password
        echo ""
        
        # Generate and escape for docker-compose
        auth=$(htpasswd -nb "$username" "$password" | sed -e 's/\$/\$\$/g')
        echo "TRAEFIK_AUTH=$auth"
        echo "PROMETHEUS_AUTH=$auth"
    else
        print_warning "htpasswd not found. Install it with:"
        echo "  sudo apt-get install apache2-utils"
    fi
    
    echo ""
    echo "==================================="
}

build_images() {
    print_info "Building Docker images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    print_success "Images built successfully"
}

run_migrations() {
    print_info "Running database migrations..."
    
    # Check if pnpm is available
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed!"
        print_info "Install it with: npm install -g pnpm"
        exit 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        pnpm install
    fi
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    cd apps/api
    pnpm prisma generate
    
    # Run migrations
    print_info "Applying migrations..."
    pnpm prisma migrate deploy
    
    cd ../..
    print_success "Migrations completed"
}

start_services() {
    print_info "Starting production services..."
    docker-compose -f docker-compose.prod.yml up -d
    print_success "Services started"
    
    print_info "Waiting for services to be healthy (30s)..."
    sleep 30
    
    # Check service health
    print_info "Checking service health..."
    docker-compose -f docker-compose.prod.yml ps
}

stop_services() {
    print_info "Stopping production services..."
    docker-compose -f docker-compose.prod.yml down
    print_success "Services stopped"
}

restart_services() {
    print_info "Restarting production services..."
    docker-compose -f docker-compose.prod.yml restart
    print_success "Services restarted"
}

view_logs() {
    service=${1:-}
    if [ -z "$service" ]; then
        docker-compose -f docker-compose.prod.yml logs -f
    else
        docker-compose -f docker-compose.prod.yml logs -f "$service"
    fi
}

check_health() {
    source .env
    domain=${DOMAIN:-localhost}
    
    print_info "Checking service health..."
    echo ""
    
    # API Health
    print_info "Checking API..."
    if curl -f -s "http://localhost:3001/api/health" > /dev/null 2>&1; then
        print_success "API is healthy (local)"
    else
        print_warning "API is not responding (local)"
    fi
    
    # Web Health
    print_info "Checking Web..."
    if curl -f -s "http://localhost:3000" > /dev/null 2>&1; then
        print_success "Web is healthy (local)"
    else
        print_warning "Web is not responding (local)"
    fi
    
    # Admin Health
    print_info "Checking Admin..."
    if curl -f -s "http://localhost:3002" > /dev/null 2>&1; then
        print_success "Admin is healthy (local)"
    else
        print_warning "Admin is not responding (local)"
    fi
    
    # Redis Health
    print_info "Checking Redis..."
    if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is healthy"
    else
        print_warning "Redis is not responding"
    fi
    
    # MinIO Health
    print_info "Checking MinIO..."
    if curl -f -s "http://localhost:9000/minio/health/live" > /dev/null 2>&1; then
        print_success "MinIO is healthy"
    else
        print_warning "MinIO is not responding"
    fi
    
    echo ""
    print_info "Service URLs (after DNS propagation):"
    echo "  - Web App:    https://app.$domain"
    echo "  - API:        https://api.$domain"
    echo "  - Admin:      https://admin.$domain"
    echo "  - Grafana:    https://grafana.$domain"
    echo "  - Prometheus: https://prometheus.$domain"
    echo "  - MinIO:      https://minio.$domain"
    echo "  - Storage:    https://storage.$domain"
}

backup_data() {
    print_info "Creating backup..."
    
    BACKUP_DIR="./backups"
    DATE=$(date +%Y%m%d-%H%M%S)
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup Redis
    print_info "Backing up Redis..."
    docker-compose -f docker-compose.prod.yml exec -T redis redis-cli --rdb /data/dump.rdb
    docker cp whalli-redis-prod:/data/dump.rdb "$BACKUP_DIR/redis-$DATE.rdb"
    
    # Backup MinIO
    print_info "Backing up MinIO..."
    docker run --rm \
        -v whalli_minio-data:/data \
        -v "$(pwd)/$BACKUP_DIR:/backup" \
        alpine tar czf "/backup/minio-$DATE.tar.gz" /data
    
    print_success "Backup completed: $BACKUP_DIR"
    ls -lh "$BACKUP_DIR"
}

update_app() {
    print_info "Updating application..."
    
    # Pull latest code
    print_info "Pulling latest code..."
    git pull origin main
    
    # Rebuild images
    build_images
    
    # Run migrations
    run_migrations
    
    # Restart services
    print_info "Restarting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Update completed"
}

scale_workers() {
    count=${1:-3}
    print_info "Scaling workers to $count instances..."
    docker-compose -f docker-compose.prod.yml up -d --scale workers="$count"
    print_success "Workers scaled to $count"
}

show_usage() {
    echo "Production Deployment Script for Whalli"
    echo ""
    echo "Usage: ./deploy-prod.sh [command]"
    echo ""
    echo "Commands:"
    echo "  check          Check prerequisites (Docker, .env, DATABASE_URL)"
    echo "  secrets        Generate secure secrets for .env file"
    echo "  build          Build Docker images"
    echo "  migrate        Run database migrations"
    echo "  start          Start all services"
    echo "  stop           Stop all services"
    echo "  restart        Restart all services"
    echo "  logs [service] View logs (all or specific service)"
    echo "  health         Check service health"
    echo "  backup         Backup Redis and MinIO data"
    echo "  update         Update application (git pull, rebuild, migrate, restart)"
    echo "  scale [N]      Scale workers to N instances (default: 3)"
    echo "  deploy         Full deployment (check, build, migrate, start)"
    echo ""
    echo "Examples:"
    echo "  ./deploy-prod.sh check"
    echo "  ./deploy-prod.sh secrets"
    echo "  ./deploy-prod.sh deploy"
    echo "  ./deploy-prod.sh logs api"
    echo "  ./deploy-prod.sh scale 5"
}

# Main script
case "${1:-}" in
    check)
        print_info "Checking prerequisites..."
        check_docker
        check_env_file
        check_database_url
        print_success "All prerequisites met!"
        ;;
    
    secrets)
        generate_secrets
        ;;
    
    build)
        check_env_file
        build_images
        ;;
    
    migrate)
        check_env_file
        run_migrations
        ;;
    
    start)
        check_env_file
        start_services
        ;;
    
    stop)
        stop_services
        ;;
    
    restart)
        restart_services
        ;;
    
    logs)
        view_logs "${2:-}"
        ;;
    
    health)
        check_health
        ;;
    
    backup)
        backup_data
        ;;
    
    update)
        check_env_file
        update_app
        ;;
    
    scale)
        scale_workers "${2:-3}"
        ;;
    
    deploy)
        print_info "Starting full deployment..."
        check_docker
        check_env_file
        check_database_url
        build_images
        run_migrations
        start_services
        check_health
        print_success "Deployment completed successfully!"
        ;;
    
    *)
        show_usage
        ;;
esac
