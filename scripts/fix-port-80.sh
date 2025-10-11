#!/bin/bash

# Script pour libérer le port 80 et diagnostiquer les conflits
# Usage: ./scripts/fix-port-80.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

print_info "=== Diagnostic du port 80 ==="

# Vérifier qui utilise le port 80
print_info "Processus utilisant le port 80:"
lsof -i :80 || print_warning "Aucun processus trouvé avec lsof"

# Alternative avec netstat
print_info "Vérification avec netstat:"
netstat -tulpn | grep :80 || print_warning "Aucun processus trouvé avec netstat"

# Alternative avec ss
print_info "Vérification avec ss:"
ss -tulpn | grep :80 || print_warning "Aucun processus trouvé avec ss"

# Vérifier les conteneurs Docker
print_info "Conteneurs Docker utilisant le port 80:"
docker ps --filter "publish=80" --format "table {{.ID}}\t{{.Names}}\t{{.Ports}}" || print_warning "Aucun conteneur Docker trouvé"

# Vérifier les services système
print_info "Services système potentiellement en conflit:"

# Apache
if systemctl is-active --quiet apache2 2>/dev/null; then
    print_warning "Apache2 est actif (peut utiliser le port 80)"
    echo "  - Arrêter: sudo systemctl stop apache2"
    echo "  - Désactiver: sudo systemctl disable apache2"
elif systemctl is-active --quiet httpd 2>/dev/null; then
    print_warning "Apache (httpd) est actif (peut utiliser le port 80)"
    echo "  - Arrêter: sudo systemctl stop httpd"
    echo "  - Désactiver: sudo systemctl disable httpd"
fi

# Nginx
if systemctl is-active --quiet nginx 2>/dev/null; then
    print_warning "Nginx est actif (peut utiliser le port 80)"
    echo "  - Arrêter: sudo systemctl stop nginx"
    echo "  - Désactiver: sudo systemctl disable nginx"
fi

# Traefik
if systemctl is-active --quiet traefik 2>/dev/null; then
    print_warning "Traefik système est actif (peut utiliser le port 80)"
    echo "  - Arrêter: sudo systemctl stop traefik"
    echo "  - Désactiver: sudo systemctl disable traefik"
fi

print_info "=== Solutions recommandées ==="

echo -e "${YELLOW}1. Arrêter les services en conflit:${NC}"
echo "   sudo systemctl stop apache2 nginx traefik"
echo "   sudo systemctl disable apache2 nginx traefik"
echo ""

echo -e "${YELLOW}2. Arrêter les conteneurs Docker conflictuels:${NC}"
echo "   docker stop \$(docker ps -q --filter \"publish=80\")"
echo ""

echo -e "${YELLOW}3. Nettoyer tous les conteneurs Docker:${NC}"
echo "   docker stop \$(docker ps -q)"
echo "   docker rm \$(docker ps -aq)"
echo ""

echo -e "${YELLOW}4. Alternative - Modifier les ports dans docker-compose.yml:${NC}"
echo "   Changer ports: \"8080:80\" au lieu de \"80:80\""
echo ""

print_info "=== Nettoyage automatique (avec confirmation) ==="

read -p "Voulez-vous arrêter tous les services web potentiellement en conflit ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Arrêt des services..."
    
    # Arrêter les services système
    for service in apache2 httpd nginx traefik; do
        if systemctl is-active --quiet $service 2>/dev/null; then
            print_info "Arrêt de $service..."
            sudo systemctl stop $service || print_warning "Impossible d'arrêter $service"
        fi
    done
    
    # Arrêter les conteneurs Docker sur le port 80
    docker_containers=$(docker ps -q --filter "publish=80" 2>/dev/null || true)
    if [ ! -z "$docker_containers" ]; then
        print_info "Arrêt des conteneurs Docker sur le port 80..."
        docker stop $docker_containers || print_warning "Impossible d'arrêter certains conteneurs"
    fi
    
    print_success "Nettoyage terminé!"
    
    # Re-vérifier
    print_info "Vérification finale du port 80:"
    if lsof -i :80 >/dev/null 2>&1; then
        print_warning "Le port 80 est encore utilisé:"
        lsof -i :80
    else
        print_success "Le port 80 est maintenant libre!"
    fi
else
    print_info "Nettoyage annulé."
fi

print_info "=== Fin du diagnostic ==="