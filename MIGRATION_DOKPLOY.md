# Migration vers Dokploy - Guide rapide

## 🎯 Résumé de la restructuration

Votre codebase Whalli a été optimisée pour Dokploy avec :

### ✅ Nouveaux fichiers créés

1. **Configuration Dokploy**
   - `dokploy.config.yml` - Configuration principale
   - `.env.dokploy.example` - Template variables d'environnement
   - `deploy-dokploy.sh` - Script de déploiement automatisé

2. **Dockerfiles optimisés**
   - `apps/api/Dockerfile.dokploy` - API NestJS
   - `apps/web/Dockerfile.dokploy` - Application Web Next.js  
   - `apps/admin/Dockerfile.dokploy` - Panel Admin Next.js
   - `apps/api/Dockerfile.workers.dokploy` - Workers background

3. **Documentation**
   - `DOKPLOY_DEPLOYMENT.md` - Guide complet de déploiement
   - `.dokployignore` - Fichiers à ignorer lors du build

### ✅ Modifications des fichiers existants

- `.gitignore` - Ajout de `.env.dokploy`
- `turbo.json` - Support des variables Dokploy

## 🚀 Déploiement en 3 étapes

### 1. Configuration

```bash
# Copier et éditer l'environnement
cp .env.dokploy.example .env.dokploy
nano .env.dokploy

# Générer des secrets sécurisés
./deploy-dokploy.sh secrets
```

### 2. Prérequis externes

- **Base de données** : Créer une instance PostgreSQL (Neon recommandé)
- **Domaine** : Configurer les DNS vers votre VPS Dokploy
- **APIs** : Obtenir les clés OpenAI, Anthropic, xAI, Stripe

### 3. Déploiement

```bash
# Déploiement complet automatisé
./deploy-dokploy.sh full
```

## 📋 Checklist de migration

### Préparation VPS

- [ ] VPS avec Dokploy installé
- [ ] Domaine configuré (DNS A record vers VPS)
- [ ] Accès SSH au VPS

### Configuration services

- [ ] Base de données PostgreSQL créée (Neon/Railway/autre)
- [ ] Variables d'environnement configurées dans `.env.dokploy`
- [ ] Secrets générés (`./deploy-dokploy.sh secrets`)

### APIs externes

- [ ] OpenAI API Key obtenue
- [ ] Anthropic API Key obtenue  
- [ ] xAI API Key obtenue
- [ ] Stripe configuré (clés + webhooks)
- [ ] OAuth Apps créées (GitHub, Google)

### Déploiement

- [ ] Configuration validée (`./deploy-dokploy.sh check`)
- [ ] Migrations appliquées (`./deploy-dokploy.sh migrate`)
- [ ] Services déployés (`./deploy-dokploy.sh deploy`)
- [ ] Health checks validés (`./deploy-dokploy.sh health`)

## 🔧 Différences avec Docker Compose

| Aspect | Docker Compose | Dokploy |
|--------|----------------|---------|
| **Orchestration** | docker-compose.yml | dokploy.config.yml |
| **SSL** | Traefik manuel | Automatique Let's Encrypt |
| **Monitoring** | Prometheus/Grafana | Interface Dokploy intégrée |
| **Scaling** | `docker-compose scale` | `dokploy scale` |
| **Logs** | `docker logs` | Interface web + CLI |
| **Updates** | Rebuild manuel | Git push auto-deploy |

## 🌐 URLs des services

Après déploiement sur `votre-domaine.com` :

- **Web App** : https://votre-domaine.com
- **API** : https://api.votre-domaine.com  
- **Admin** : https://admin.votre-domaine.com
- **Storage** : https://storage.votre-domaine.com
- **MinIO UI** : https://minio.votre-domaine.com

## 🔄 Workflow de développement

### Développement local (inchangé)

```bash
pnpm dev  # Continue à fonctionner normalement
```

### Déploiement production

```bash
git push origin main
./deploy-dokploy.sh deploy
```

## 📞 Support

En cas de problème :

1. **Vérifier les logs** : `./deploy-dokploy.sh logs [service]`
2. **Rollback** : `./deploy-dokploy.sh rollback`
3. **Documentation** : Consulter `DOKPLOY_DEPLOYMENT.md`

## 🎉 Avantages Dokploy

- ✅ **Interface graphique** pour gérer les déploiements
- ✅ **SSL automatique** avec Let's Encrypt
- ✅ **Monitoring intégré** et métriques
- ✅ **Auto-scaling** et gestion des ressources
- ✅ **Rollbacks** automatiques en cas d'échec
- ✅ **Git integration** pour déploiements automatiques
- ✅ **Multi-environnements** (staging/production)

Votre migration est prête ! 🚀