# Déploiement Whalli sur Dokploy

Guide complet pour déployer Whalli sur un VPS utilisant Dokploy.

## 📋 Prérequis

### 1. VPS et Dokploy
- VPS avec Docker installé
- Dokploy installé sur le VPS
- Nom de domaine configuré avec DNS

### 2. Services externes
- **Base de données PostgreSQL** (Neon, Railway, ou auto-hébergée)
- **Comptes API** : OpenAI, Anthropic, xAI, Stripe
- **OAuth Apps** : GitHub, Google

## 🚀 Installation rapide

### 1. Préparer la configuration

```bash
# Copier le fichier d'environnement
cp .env.dokploy.example .env.dokploy

# Éditer la configuration
nano .env.dokploy
```

### 2. Configurer les variables d'environnement

Éditez `.env.dokploy` avec vos valeurs :

```bash
# Domaine principal
DOMAIN=votre-domaine.com

# Base de données (Neon PostgreSQL recommandé)
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/db?sslmode=require

# Générer des secrets sécurisés
./deploy-dokploy.sh secrets
```

### 3. Déployer

```bash
# Déploiement complet
./deploy-dokploy.sh full
```

## 🔧 Configuration détaillée

### Structure des services

```
whalli/
├── api/           # NestJS API (Port 3001)
├── web/           # Next.js Web App (Port 3000)
├── admin/         # Next.js Admin (Port 3002)
├── workers/       # Background Jobs
├── redis/         # Cache et files d'attente
└── minio/         # Stockage S3-compatible
```

### Domaines configurés

- **Web App** : `https://votre-domaine.com`
- **API** : `https://api.votre-domaine.com`
- **Admin** : `https://admin.votre-domaine.com`
- **Storage** : `https://storage.votre-domaine.com`
- **MinIO UI** : `https://minio.votre-domaine.com`

### Variables d'environnement critiques

```bash
# Authentification
JWT_SECRET=...                    # Généré avec openssl rand -base64 32
BETTER_AUTH_SECRET=...           # Généré avec openssl rand -base64 32

# Base de données
DATABASE_URL=postgresql://...    # Neon, Railway, etc.

# Redis
REDIS_PASSWORD=...               # Mot de passe sécurisé

# MinIO
MINIO_ROOT_PASSWORD=...          # Mot de passe administrateur

# APIs externes
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...
STRIPE_SECRET_KEY=sk_test_...
```

## 📦 Commandes de déploiement

### Vérifications préalables

```bash
# Vérifier tous les prérequis
./deploy-dokploy.sh check

# Valider la configuration
./deploy-dokploy.sh validate

# Générer des secrets
./deploy-dokploy.sh secrets
```

### Déploiement

```bash
# Déploiement complet (recommandé)
./deploy-dokploy.sh full

# Ou étape par étape
./deploy-dokploy.sh migrate     # Migrations base de données
./deploy-dokploy.sh deploy      # Déploiement
./deploy-dokploy.sh health      # Vérification santé
```

### Gestion des services

```bash
# Consulter les logs
./deploy-dokploy.sh logs api
./deploy-dokploy.sh logs web
./deploy-dokploy.sh logs workers

# Scaler les services
./deploy-dokploy.sh scale workers 3
./deploy-dokploy.sh scale api 2

# Rollback en cas de problème
./deploy-dokploy.sh rollback
```

## 🔍 Monitoring et maintenance

### Health checks

Les services incluent des health checks automatiques :

- **API** : `GET /api/health`
- **Web/Admin** : `GET /`
- **Intervalles** : 30s avec retry

### Logs centralisés

```bash
# Logs en temps réel
./deploy-dokploy.sh logs api --follow

# Logs spécifiques
dokploy logs whalli-web --since=1h
```

### Métriques

- **Prometheus** : Métriques API disponibles sur `/api/metrics`
- **Ressources** : Monitoring via interface Dokploy

## 🗃️ Base de données

### Neon PostgreSQL (recommandé)

1. Créer un projet sur [neon.tech](https://neon.tech)
2. Récupérer la connection string
3. Configurer `DATABASE_URL` dans `.env.dokploy`

```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require
```

### Migrations

```bash
# Appliquer les migrations
./deploy-dokploy.sh migrate

# Ou manuellement
cd apps/api
pnpm prisma migrate deploy
```

## 🔐 Sécurité

### Secrets à configurer

1. **Génération automatique** :
   ```bash
   ./deploy-dokploy.sh secrets
   ```

2. **OAuth Apps** :
   - GitHub : [Developer Settings](https://github.com/settings/developers)
   - Google : [Google Cloud Console](https://console.cloud.google.com)

3. **Stripe** :
   - Clés API : [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Webhooks : Configurer endpoint `https://api.votre-domaine.com/api/billing/webhooks/stripe`

### Certificats SSL

Dokploy gère automatiquement les certificats SSL via Let's Encrypt.

## 🐳 Architecture Docker

### Images optimisées

- **Multi-stage builds** pour réduire la taille
- **Non-root users** pour la sécurité
- **Health checks** intégrés
- **Cache pnpm** pour builds rapides

### Ressources par défaut

```yaml
api:      512Mi RAM, 0.5 CPU
web:      256Mi RAM, 0.25 CPU
admin:    256Mi RAM, 0.25 CPU
workers:  256Mi RAM, 0.25 CPU
redis:    128Mi RAM, 0.1 CPU
minio:    256Mi RAM, 0.25 CPU
```

## 🚨 Résolution de problèmes

### Problèmes courants

1. **API ne démarre pas**
   ```bash
   # Vérifier les logs
   ./deploy-dokploy.sh logs api
   
   # Vérifier la connexion DB
   dokploy exec whalli-api -- npx prisma db pull
   ```

2. **Build failed**
   ```bash
   # Nettoyer le cache Docker
   docker system prune -a
   
   # Rebuilder localement
   ./deploy-dokploy.sh build
   ```

3. **Services inaccessibles**
   ```bash
   # Vérifier le DNS
   nslookup api.votre-domaine.com
   
   # Vérifier les certificats SSL
   curl -I https://api.votre-domaine.com
   ```

### Logs de debug

```bash
# Activer le mode debug
export DEBUG=true

# Logs détaillés
dokploy logs whalli-api --since=1h --follow
```

## 📚 Ressources

- [Documentation Dokploy](https://dokploy.com/docs)
- [Neon PostgreSQL](https://neon.tech/docs)
- [Configuration Prisma](https://www.prisma.io/docs)
- [Next.js Standalone](https://nextjs.org/docs/pages/api-reference/next-config-js/output)

## 🔄 Mise à jour

```bash
# Pull latest changes
git pull origin main

# Redéployer
./deploy-dokploy.sh deploy

# Vérifier
./deploy-dokploy.sh health
```