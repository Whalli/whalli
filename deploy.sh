#!/bin/bash

# =================================================================
# Whalli VPS Deployment Script
# =================================================================
# This script helps deploy Whalli to a VPS with Docker Compose

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
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

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_status "Please copy .env.example to .env and configure your environment variables."
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=("DOMAIN" "ACME_EMAIL" "POSTGRES_PASSWORD" "REDIS_PASSWORD" "JWT_SECRET" "NEXTAUTH_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set!"
        exit 1
    fi
done

print_status "Starting Whalli deployment..."

# Function to check if docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed."
}

# Function to setup directories and permissions
setup_directories() {
    print_status "Setting up directories and permissions..."
    
    # Create necessary directories
    mkdir -p ./data/postgres
    mkdir -p ./data/redis
    mkdir -p ./data/minio
    mkdir -p ./data/traefik
    
    # Set proper permissions
    chmod 600 .env
    
    print_success "Directories and permissions setup completed."
}

# Function to generate secrets if not provided
generate_secrets() {
    print_status "Checking secrets..."
    
    # Check if JWT_SECRET needs to be generated
    if [ "$JWT_SECRET" = "your-very-long-and-secure-jwt-secret-key" ]; then
        print_warning "JWT_SECRET is using default value. Please update it in .env file."
    fi
    
    # Check if NEXTAUTH_SECRET needs to be generated
    if [ "$NEXTAUTH_SECRET" = "your-very-long-and-secure-nextauth-secret-key" ]; then
        print_warning "NEXTAUTH_SECRET is using default value. Please update it in .env file."
    fi
}

# Function to build images
build_images() {
    print_status "Building Docker images..."
    
    # Build all application images
    docker-compose build --no-cache
    
    print_success "Docker images built successfully."
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    # Start infrastructure services first
    docker-compose up -d traefik postgres redis minio
    
    print_status "Waiting for infrastructure services to be ready..."
    sleep 30
    
    # Run database migrations
    print_status "Running database migrations..."
    docker-compose run --rm api pnpm prisma migrate deploy
    docker-compose run --rm api pnpm prisma generate
    
    # Start application services
    docker-compose up -d api web admin
    
    print_success "All services started successfully."
}

# Function to show deployment info
show_deployment_info() {
    print_success "Deployment completed successfully!"
    echo ""
    print_status "Your Whalli instance is available at:"
    echo "  🌐 Web App:      https://web.$DOMAIN"
    echo "  🚀 API:          https://api.$DOMAIN"
    echo "  ⚙️  Admin Panel:  https://admin.$DOMAIN"
    echo "  📊 Traefik:      https://traefik.$DOMAIN"
    echo "  💾 MinIO:        https://minio.$DOMAIN"
    echo "  🗄️  Storage API:  https://storage.$DOMAIN"
    echo ""
    print_status "Make sure your DNS records point to this server:"
    echo "  A    $DOMAIN                -> $(curl -s ifconfig.me)"
    echo "  CNAME *.${DOMAIN}          -> $DOMAIN"
    echo ""
    print_warning "It may take a few minutes for Let's Encrypt certificates to be issued."
    echo ""
    print_status "To view logs: docker-compose logs -f [service_name]"
    print_status "To stop all services: docker-compose down"
    print_status "To update: git pull && ./deploy.sh"
}

# Function to check service health
check_health() {
    print_status "Checking service health..."
    
    services=("traefik" "postgres" "redis" "minio" "api" "web" "admin")
    
    for service in "${services[@]}"; do
        if docker-compose ps $service | grep -q "Up"; then
            print_success "$service is running"
        else
            print_error "$service is not running"
        fi
    done
}

# Main deployment process
main() {
    case "${1:-deploy}" in
        "deploy")
            check_docker
            setup_directories
            generate_secrets
            build_images
            start_services
            check_health
            show_deployment_info
            ;;
        "update")
            print_status "Updating Whalli..."
            git pull
            build_images
            docker-compose up -d
            check_health
            print_success "Update completed!"
            ;;
        "stop")
            print_status "Stopping all services..."
            docker-compose down
            print_success "All services stopped."
            ;;
        "restart")
            print_status "Restarting all services..."
            docker-compose restart
            check_health
            print_success "All services restarted."
            ;;
        "logs")
            docker-compose logs -f ${2:-}
            ;;
        "status")
            check_health
            ;;
        "backup")
            print_status "Creating backup..."
            ./backup.sh
            ;;
        *)
            echo "Usage: $0 {deploy|update|stop|restart|logs [service]|status|backup}"
            echo ""
            echo "Commands:"
            echo "  deploy   - Full deployment (default)"
            echo "  update   - Pull latest code and rebuild"
            echo "  stop     - Stop all services"
            echo "  restart  - Restart all services"
            echo "  logs     - Show logs (optionally for specific service)"
            echo "  status   - Check service health"
            echo "  backup   - Create database backup"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"