#!/bin/bash

# Dokploy Deployment Script for Whalli
# Version: 1.0.0
# Usage: ./deploy-dokploy.sh [command]

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

check_dokploy_cli() {
    if ! command -v dokploy &> /dev/null; then
        print_error "Dokploy CLI is not installed!"
        print_info "Install it with: npm install -g dokploy-cli"
        exit 1
    fi
    print_success "Dokploy CLI is installed"
}

check_env_file() {
    if [ ! -f .env.dokploy ]; then
        print_error ".env.dokploy file not found!"
        print_info "Copy .env.dokploy.example to .env.dokploy and configure it:"
        echo "  cp .env.dokploy.example .env.dokploy"
        echo "  nano .env.dokploy"
        exit 1
    fi
    print_success ".env.dokploy file found"
}

validate_config() {
    print_info "Validating Dokploy configuration..."
    
    if [ ! -f dokploy.config.yml ]; then
        print_error "dokploy.config.yml not found!"
        exit 1
    fi
    
    # Check required Dockerfiles
    local dockerfiles=(
        "apps/api/Dockerfile.dokploy"
        "apps/web/Dockerfile.dokploy"
        "apps/admin/Dockerfile.dokploy"
        "apps/api/Dockerfile.workers.dokploy"
    )
    
    for dockerfile in "${dockerfiles[@]}"; do
        if [ ! -f "$dockerfile" ]; then
            print_error "Missing $dockerfile"
            exit 1
        fi
    done
    
    print_success "Configuration validated"
}

generate_secrets() {
    print_info "Generating secure secrets..."
    
    echo ""
    echo "=== Copy these to your .env.dokploy file ==="
    echo ""
    
    echo "# Generated secrets - $(date)"
    echo "JWT_SECRET=$(openssl rand -base64 32)"
    echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"
    echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
    echo "MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)"
    
    echo ""
    echo "==================================="
}

check_database() {
    source .env.dokploy
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL is not set in .env.dokploy file!"
        print_info "Please configure your database connection string."
        exit 1
    fi
    
    print_success "Database configuration found"
}

build_images() {
    print_info "Building Docker images for Dokploy..."
    
    local services=("api" "web" "admin" "workers")
    
    for service in "${services[@]}"; do
        print_info "Building $service..."
        
        case $service in
            "api")
                docker build -f apps/api/Dockerfile.dokploy -t whalli-$service:latest .
                ;;
            "web")
                docker build -f apps/web/Dockerfile.dokploy -t whalli-$service:latest .
                ;;
            "admin")
                docker build -f apps/admin/Dockerfile.dokploy -t whalli-$service:latest .
                ;;
            "workers")
                docker build -f apps/api/Dockerfile.workers.dokploy -t whalli-$service:latest .
                ;;
        esac
        
        print_success "$service image built"
    done
    
    print_success "All images built successfully"
}

run_migrations() {
    print_info "Running database migrations..."
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        pnpm install
    fi
    
    # Run migrations
    cd apps/api
    print_info "Generating Prisma client..."
    pnpm prisma generate
    
    print_info "Applying migrations..."
    pnpm prisma migrate deploy
    
    cd ../..
    print_success "Migrations completed"
}

deploy() {
    print_info "Deploying to Dokploy..."
    
    # Load environment variables
    source .env.dokploy
    
    # Deploy using Dokploy CLI
    dokploy deploy --config dokploy.config.yml --env .env.dokploy
    
    print_success "Deployment initiated"
}

check_health() {
    print_info "Checking service health..."
    
    source .env.dokploy
    
    # Wait for services to be ready
    sleep 30
    
    # Check API health
    print_info "Checking API..."
    if curl -f -s "https://api.$DOMAIN/api/health" > /dev/null 2>&1; then
        print_success "API is healthy"
    else
        print_warning "API is not responding"
    fi
    
    # Check Web health
    print_info "Checking Web..."
    if curl -f -s "https://$DOMAIN" > /dev/null 2>&1; then
        print_success "Web is healthy"
    else
        print_warning "Web is not responding"
    fi
    
    # Check Admin health
    print_info "Checking Admin..."
    if curl -f -s "https://admin.$DOMAIN" > /dev/null 2>&1; then
        print_success "Admin is healthy"
    else
        print_warning "Admin is not responding"
    fi
    
    echo ""
    print_info "Service URLs:"
    echo "  - Web App:    https://$DOMAIN"
    echo "  - API:        https://api.$DOMAIN"
    echo "  - Admin:      https://admin.$DOMAIN"
    echo "  - Storage:    https://storage.$DOMAIN"
    echo "  - MinIO UI:   https://minio.$DOMAIN"
}

logs() {
    service=${1:-}
    if [ -z "$service" ]; then
        print_error "Please specify a service: api, web, admin, workers, redis, minio"
        exit 1
    fi
    
    print_info "Fetching logs for $service..."
    dokploy logs whalli-$service --follow
}

scale() {
    service=${1:-}
    replicas=${2:-1}
    
    if [ -z "$service" ]; then
        print_error "Please specify a service: api, web, admin, workers"
        exit 1
    fi
    
    print_info "Scaling $service to $replicas replicas..."
    dokploy scale whalli-$service --replicas=$replicas
    
    print_success "$service scaled to $replicas replicas"
}

rollback() {
    print_info "Rolling back deployment..."
    dokploy rollback whalli
    print_success "Rollback completed"
}

show_usage() {
    echo "Dokploy Deployment Script for Whalli"
    echo ""
    echo "Usage: ./deploy-dokploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  check          Check prerequisites (Dokploy CLI, .env, config)"
    echo "  secrets        Generate secure secrets for .env.dokploy file"
    echo "  validate       Validate Dokploy configuration"
    echo "  build          Build Docker images locally"
    echo "  migrate        Run database migrations"
    echo "  deploy         Deploy to Dokploy"
    echo "  health         Check service health"
    echo "  logs [service] View logs for specific service"
    echo "  scale [service] [replicas] Scale service"
    echo "  rollback       Rollback to previous deployment"
    echo "  full           Full deployment (check, migrate, deploy, health)"
    echo ""
    echo "Examples:"
    echo "  ./deploy-dokploy.sh check"
    echo "  ./deploy-dokploy.sh secrets"
    echo "  ./deploy-dokploy.sh full"
    echo "  ./deploy-dokploy.sh logs api"
    echo "  ./deploy-dokploy.sh scale workers 3"
}

# Main script
case "${1:-}" in
    check)
        print_info "Checking prerequisites..."
        check_dokploy_cli
        check_env_file
        validate_config
        check_database
        print_success "All prerequisites met!"
        ;;
    
    secrets)
        generate_secrets
        ;;
    
    validate)
        validate_config
        ;;
    
    build)
        check_env_file
        build_images
        ;;
    
    migrate)
        check_env_file
        run_migrations
        ;;
    
    deploy)
        check_env_file
        validate_config
        deploy
        ;;
    
    health)
        check_health
        ;;
    
    logs)
        logs "${2:-}"
        ;;
    
    scale)
        scale "${2:-}" "${3:-1}"
        ;;
    
    rollback)
        rollback
        ;;
    
    full)
        print_info "Starting full deployment..."
        check_dokploy_cli
        check_env_file
        validate_config
        check_database
        run_migrations
        deploy
        check_health
        print_success "Full deployment completed successfully!"
        ;;
    
    *)
        show_usage
        ;;
esac