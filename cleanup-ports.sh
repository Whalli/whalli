#!/bin/bash

# Script de nettoyage pour libérer les ports occupés
# Usage: ./cleanup-ports.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

cleanup_ports() {
    print_info "Nettoyage des ports occupés..."
    
    # Ports utilisés par Whalli
    PORTS=(80 443 3000 3001 3002 6379 9000 9001 9090 8080)
    
    for port in "${PORTS[@]}"; do
        print_info "Vérification du port $port..."
        
        # Trouver les processus utilisant le port
        PIDS=$(lsof -ti:$port 2>/dev/null || true)
        
        if [ ! -z "$PIDS" ]; then
            print_warning "Port $port occupé par PID(s): $PIDS"
            
            # Arrêter les processus
            for pid in $PIDS; do
                if kill -0 $pid 2>/dev/null; then
                    print_info "Arrêt du processus $pid..."
                    kill -TERM $pid 2>/dev/null || true
                    sleep 2
                    
                    # Force kill si nécessaire
                    if kill -0 $pid 2>/dev/null; then
                        print_warning "Force kill du processus $pid..."
                        kill -KILL $pid 2>/dev/null || true
                    fi
                fi
            done
            
            print_success "Port $port libéré"
        else
            print_success "Port $port libre"
        fi
    done
}

cleanup_docker() {
    print_info "Nettoyage des conteneurs Docker..."
    
    # Arrêter tous les conteneurs
    if docker ps -q | grep -q .; then
        print_info "Arrêt des conteneurs en cours..."
        docker stop $(docker ps -q) 2>/dev/null || true
    fi
    
    # Supprimer les conteneurs arrêtés
    if docker ps -aq | grep -q .; then
        print_info "Suppression des conteneurs arrêtés..."
        docker rm $(docker ps -aq) 2>/dev/null || true
    fi
    
    # Nettoyer les réseaux inutilisés
    print_info "Nettoyage des réseaux Docker..."
    docker network prune -f 2>/dev/null || true
    
    # Nettoyer les volumes orphelins
    print_info "Nettoyage des volumes Docker..."
    docker volume prune -f 2>/dev/null || true
    
    print_success "Nettoyage Docker terminé"
}

cleanup_whalli() {
    print_info "Nettoyage spécifique Whalli..."
    
    # Composition Docker
    local compose_cmd=""
    if command -v docker-compose &> /dev/null; then
        compose_cmd="docker-compose"
    elif docker compose version &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    if [ ! -z "$compose_cmd" ]; then
        # Arrêter les services de développement
        if [ -f "docker-compose.yml" ]; then
            print_info "Arrêt docker-compose.yml..."
            $compose_cmd -f docker-compose.yml down --volumes --remove-orphans 2>/dev/null || true
        fi
        
        # Arrêter les services de production
        if [ -f "docker-compose.prod.yml" ]; then
            print_info "Arrêt docker-compose.prod.yml..."
            $compose_cmd -f docker-compose.prod.yml down --volumes --remove-orphans 2>/dev/null || true
        fi
    fi
    
    # Arrêter les processus Node.js de développement
    print_info "Arrêt des processus Node.js..."
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "nest start" 2>/dev/null || true
    pkill -f "turbo dev" 2>/dev/null || true
    
    print_success "Nettoyage Whalli terminé"
}

show_usage() {
    echo "Script de nettoyage des ports et processus Whalli"
    echo ""
    echo "Usage: ./cleanup-ports.sh [command]"
    echo ""
    echo "Commands:"
    echo "  ports     Libérer les ports occupés"
    echo "  docker    Nettoyer Docker (conteneurs, réseaux, volumes)"
    echo "  whalli    Arrêter spécifiquement les services Whalli"
    echo "  all       Nettoyage complet (par défaut)"
    echo ""
    echo "Examples:"
    echo "  ./cleanup-ports.sh"
    echo "  ./cleanup-ports.sh ports"
    echo "  ./cleanup-ports.sh docker"
    echo "  ./cleanup-ports.sh all"
}

# Main script
case "${1:-all}" in
    ports)
        cleanup_ports
        ;;
    
    docker)
        cleanup_docker
        ;;
    
    whalli)
        cleanup_whalli
        ;;
    
    all)
        print_info "Nettoyage complet..."
        cleanup_whalli
        cleanup_docker
        cleanup_ports
        print_success "Nettoyage complet terminé!"
        ;;
    
    *)
        show_usage
        ;;
esac