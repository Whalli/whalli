# 🔌 Configuration des Ports Whalli

## Vue d'ensemble

Cette configuration utilise un **mapping de ports** pour que toutes les applications écoutent sur le **port 3000 à l'intérieur** des conteneurs, mais soient accessibles de l'**extérieur** sur des ports différents.

## 🎯 Mapping des Ports

| Service | Port Externe | Port Interne | URL de Production |
|---------|-------------|-------------|-------------------|
| **Web** | `4000` | `3000` | `https://web.${DOMAIN}` |
| **API** | `4001` | `3000` | `https://api.${DOMAIN}` |
| **Admin** | `4002` | `3000` | `https://admin.${DOMAIN}` |

## 📋 Configuration Docker Compose

```yaml
# Service API
api:
  environment:
    PORT: 3000  # Port interne du conteneur
  ports:
    - "4001:3000"  # externe:interne

# Service Web
web:
  environment:
    PORT: 3000  # Port interne du conteneur
  ports:
    - "4000:3000"  # externe:interne

# Service Admin
admin:
  environment:
    PORT: 3000  # Port interne du conteneur
  ports:
    - "4002:3000"  # externe:interne
```

## 🐳 Configuration Dockerfile

Tous les Dockerfiles sont configurés pour écouter sur le port 3000 :

```dockerfile
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
```

## 🌐 Traefik Load Balancer

Traefik redirige le trafic vers le port **3000** à l'intérieur de chaque conteneur :

```yaml
labels:
  - traefik.http.services.api.loadbalancer.server.port=3000
  - traefik.http.services.web.loadbalancer.server.port=3000
  - traefik.http.services.admin.loadbalancer.server.port=3000
```

## 🔍 Health Checks

Les health checks vérifient également le port **3000** interne :

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]  # API
  test: ["CMD", "curl", "-f", "http://localhost:3000"]             # Web/Admin
```

## 🚀 Accès aux Applications

### En développement local (sans Docker)
```bash
# Applications en mode dev
pnpm dev
# Web:   http://localhost:3000
# API:   http://localhost:3001
# Admin: http://localhost:3002
```

### Avec Docker Compose
```bash
# Via les ports mappés
# Web:   http://localhost:4000
# API:   http://localhost:4001  
# Admin: http://localhost:4002
```

### En production (via Traefik)
```bash
# Via les domaines
# Web:   https://web.yourdomain.com
# API:   https://api.yourdomain.com
# Admin: https://admin.yourdomain.com
```

## 🔧 Avantages de cette Configuration

### ✅ **Simplicité interne**
- Toutes les apps utilisent le même port (3000) à l'intérieur
- Configuration Dockerfile uniforme
- Health checks cohérents

### ✅ **Flexibilité externe**
- Ports externes distincts pour chaque service
- Évite les conflits de ports
- Compatible avec différents environnements

### ✅ **Production Ready**
- Traefik gère le routage par domaine
- SSL/TLS automatique avec Let's Encrypt
- Load balancing et haute disponibilité

## 🛠️ Dépannage

### Port déjà utilisé
```bash
# Vérifier les ports utilisés
lsof -i :4000,4001,4002

# Libérer les ports
./scripts/fix-port-80.sh
./cleanup-ports.sh
```

### Accès aux logs
```bash
# Logs des conteneurs
docker-compose logs web
docker-compose logs api
docker-compose logs admin

# Logs en temps réel
docker-compose logs -f web
```

### Test des endpoints
```bash
# Test local (ports mappés)
curl http://localhost:4000        # Web
curl http://localhost:4001/api/health  # API
curl http://localhost:4002        # Admin

# Test production (via Traefik)
curl https://web.yourdomain.com
curl https://api.yourdomain.com/api/health
curl https://admin.yourdomain.com
```

## 📝 Notes importantes

1. **Port 80/443** : Utilisés par Traefik pour le reverse proxy
2. **Ports 4000-4002** : Accès direct aux conteneurs (dev/debug)
3. **Port 3000** : Port interne standard pour toutes les apps
4. **Variables ENV** : `PORT=3000` dans tous les conteneurs

Cette configuration offre la **meilleure flexibilité** entre développement, test et production ! 🎉