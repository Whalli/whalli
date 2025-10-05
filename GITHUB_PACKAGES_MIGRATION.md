# Migration vers l'Organisation Whalli - GitHub Actions

Documentation des modifications apportées aux workflows GitHub Actions pour utiliser le registry de l'organisation Whalli.

## 📦 Modifications Effectuées

### 1. Workflow CI/CD (`.github/workflows/ci-cd.yml`)

#### **Avant** :
```yaml
username: ${{ github.actor }}  # Utilisateur personnel
images: ghcr.io/${{ github.repository }}/${{ matrix.app }}  # ghcr.io/GeekMonstar/whalli/web
```

#### **Après** :
```yaml
username: ${{ github.repository_owner }}  # Propriétaire du repo (organisation)
images: ghcr.io/whalli/${{ matrix.app }}  # ghcr.io/whalli/web
```

### 2. Chemins des Images Docker

Les images Docker sont maintenant stockées dans le registry de l'organisation :

| Service | Ancien chemin | Nouveau chemin |
|---------|--------------|----------------|
| Web | `ghcr.io/geekmonstar/whalli/web` | `ghcr.io/whalli/web` |
| API | `ghcr.io/geekmonstar/whalli/api` | `ghcr.io/whalli/api` |
| Admin | `ghcr.io/geekmonstar/whalli/admin` | `ghcr.io/whalli/admin` |

### 3. Tags des Images

Tags automatiques ajoutés :
- `type=ref,event=branch` - Nom de la branche (ex: `main`)
- `type=ref,event=pr` - Numéro de PR (ex: `pr-123`)
- `type=sha` - Hash du commit (ex: `sha-abc123`)
- `type=semver,pattern={{version}}` - Version sémantique (ex: `1.2.3`)
- `type=semver,pattern={{major}}.{{minor}}` - Version majeure.mineure (ex: `1.2`)

## 🔐 Permissions Requises

### GitHub Packages

Pour que les workflows fonctionnent, le `GITHUB_TOKEN` doit avoir les permissions suivantes :

```yaml
permissions:
  contents: read
  packages: write
```

Ces permissions sont automatiquement accordées par GitHub Actions dans le contexte de l'organisation.

### Organisation Whalli

L'organisation doit avoir :
- ✅ GitHub Packages activé
- ✅ Accès public ou privé aux packages configuré
- ✅ Membres avec droits d'écriture sur le repository

## 📊 Vérification

### Vérifier les Images Buildées

Après le prochain push sur `main`, les images seront visibles sur :

```
https://github.com/orgs/Whalli/packages?repo_name=whalli
```

Ou directement :
- https://github.com/Whalli/whalli/pkgs/container/web
- https://github.com/Whalli/whalli/pkgs/container/api
- https://github.com/Whalli/whalli/pkgs/container/admin

### Tester Localement

Pour tester les nouvelles images buildées :

```bash
# Pull une image depuis le registry de l'organisation
docker pull ghcr.io/whalli/web:main
docker pull ghcr.io/whalli/api:main
docker pull ghcr.io/whalli/admin:main

# Run localement
docker run -p 3000:3000 ghcr.io/whalli/web:main
```

### Authentification pour Pull

Si les packages sont privés, authentification requise :

```bash
# Créer un Personal Access Token avec scope 'read:packages'
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Ou utiliser GitHub CLI
gh auth token | docker login ghcr.io -u USERNAME --password-stdin
```

## 🚀 Workflow de Déploiement

### Option 1 : Build Local (Actuel)

Le workflow `deploy.yml` actuel build les images directement sur le serveur :

```bash
docker-compose -f docker-compose.prod.yml build --no-cache
```

**Avantages** :
- ✅ Pas besoin d'authentification registry
- ✅ Build adapté à l'architecture du serveur

**Inconvénients** :
- ⚠️ Build plus lent (pas de cache distribué)
- ⚠️ Charge CPU élevée sur le serveur
- ⚠️ Temps de déploiement plus long

### Option 2 : Pull depuis Registry (Recommandé)

Modifier `docker-compose.prod.yml` pour utiliser les images pré-buildées :

```yaml
services:
  web:
    image: ghcr.io/whalli/web:${IMAGE_TAG:-main}
    # Plus besoin de 'build:'
    
  api:
    image: ghcr.io/whalli/api:${IMAGE_TAG:-main}
    
  admin:
    image: ghcr.io/whalli/admin:${IMAGE_TAG:-main}
```

**Avantages** :
- ✅ Déploiement ultra-rapide (juste pull + restart)
- ✅ Images déjà testées en CI
- ✅ Pas de build sur le serveur production
- ✅ Rollback instantané (juste changer le tag)

**Inconvénients** :
- ⚠️ Nécessite authentification registry sur serveur

## 🔄 Migration vers Pull depuis Registry

### Étape 1 : Modifier docker-compose.prod.yml

```yaml
# Avant (build local)
services:
  web:
    build:
      context: .
      dockerfile: ./apps/web/Dockerfile

# Après (pull depuis registry)
services:
  web:
    image: ghcr.io/whalli/web:${IMAGE_TAG:-main}
```

### Étape 2 : Authentifier le Serveur

Sur le serveur de production :

```bash
# Créer un GitHub PAT avec scope 'read:packages'
# https://github.com/settings/tokens/new

# Se connecter au registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Vérifier
docker pull ghcr.io/whalli/web:main
```

### Étape 3 : Modifier le Workflow deploy.yml

```yaml
- name: Deploy to server
  run: |
    ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
      cd /opt/whalli
      git pull origin main
      
      # Plus besoin de build, juste pull
      docker-compose -f docker-compose.prod.yml pull
      docker-compose -f docker-compose.prod.yml up -d
    ENDSSH
```

### Étape 4 : Variables d'Environnement

Ajouter dans le workflow ou `.env` :

```bash
IMAGE_TAG=main  # ou sha-abc123, ou v1.2.3
```

## 📈 Avantages de la Migration

### Performance
- ⚡ **Build Time** : ~5 min → ~30 sec (pull uniquement)
- ⚡ **Deployment Time** : ~10 min → ~2 min
- ⚡ **Rollback Time** : ~10 min → ~30 sec

### Fiabilité
- ✅ Images testées en CI avant déploiement
- ✅ Même image en staging et production
- ✅ Rollback instantané vers version précédente
- ✅ Pas de "build failed" en production

### Coûts
- 💰 Moins de CPU utilisé sur serveur production
- 💰 Déploiements plus rapides = moins de downtime
- 💰 Registry GitHub gratuit (500MB public, 2GB privé)

## 🔍 Monitoring

### Surveiller les Builds

Dashboard GitHub Actions :
```
https://github.com/Whalli/whalli/actions
```

### Surveiller les Packages

Registry de l'organisation :
```
https://github.com/orgs/Whalli/packages
```

Metrics disponibles :
- Nombre de pulls
- Taille des images
- Versions disponibles
- Vulnérabilités détectées

### Nettoyer les Anciennes Images

GitHub conserve toutes les versions. Pour nettoyer :

```bash
# Via GitHub CLI
gh api \
  --method DELETE \
  -H "Accept: application/vnd.github+json" \
  /orgs/Whalli/packages/container/web/versions/OLD_VERSION_ID
```

Ou configurer une politique de rétention :
```yaml
# .github/workflows/cleanup-packages.yml
- name: Delete old package versions
  uses: actions/delete-package-versions@v4
  with:
    package-name: 'web'
    package-type: 'container'
    min-versions-to-keep: 10
    delete-only-untagged-versions: true
```

## 🎯 Next Steps

1. ✅ **Effectué** : Modifier ci-cd.yml pour utiliser registry organisation
2. ⏳ **À faire** : Tester le build avec un push sur main
3. ⏳ **À faire** : Vérifier les images dans le registry
4. ⏳ **Optionnel** : Migrer vers pull depuis registry (plus rapide)
5. ⏳ **Optionnel** : Configurer cleanup automatique des vieilles images

## 📚 Documentation Officielle

- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Docker Metadata Action](https://github.com/docker/metadata-action)

---

**Date de migration** : 5 octobre 2025  
**Organisation** : Whalli  
**Repository** : whalli  
**Registry** : ghcr.io/whalli  
**Status** : ✅ Configuré et prêt
