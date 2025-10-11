# 🚀 Guide de déploiement Dokploy - Résolution des conflits

## ❌ Problèmes identifiés

1. **Port 80 déjà utilisé** : Dokploy utilise probablement déjà le port 80
2. **Variables manquantes** : POSTGRES_USER, POSTGRES_PASSWORD, etc.

## ✅ Solutions appliquées

### 1. **Ports alternatifs pour Traefik**
```yaml
ports:
  - "8080:80"   # HTTP sur port 8080 (au lieu de 80)
  - "8443:443"  # HTTPS sur port 8443 (au lieu de 443) 
  - "8082:8080" # Dashboard Traefik
```

### 2. **Valeurs par défaut pour les variables**
```yaml
environment:
  POSTGRES_USER: ${POSTGRES_USER:-whalli_user}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme123}
  REDIS_PASSWORD: ${REDIS_PASSWORD:-changeme456}
```

### 3. **Fichier spécifique Dokploy créé**
- `docker-compose.dokploy.yml` avec ports alternatifs
- Valeurs par défaut pour toutes les variables critiques
- Configuration allégée (sans Prometheus/Grafana pour simplifier)

## 🛠️ Instructions de déploiement

### Option A : Utiliser le fichier Dokploy spécifique
1. Dans Dokploy, sélectionnez `docker-compose.dokploy.yml` comme fichier compose
2. Configurez uniquement les variables essentielles :
   ```bash
   DOMAIN=votre-domaine.com
   ACME_EMAIL=votre-email@domaine.com
   POSTGRES_PASSWORD=un-mot-de-passe-securise
   REDIS_PASSWORD=un-autre-mot-de-passe
   JWT_SECRET=une-cle-secrete-tres-longue
   NEXTAUTH_SECRET=une-autre-cle-secrete
   ```

### Option B : Modifier le docker-compose.yml principal
1. Les ports Traefik ont été changés en 8080/8443
2. Configurez toutes les variables dans Dokploy
3. Accès via : `http://votre-domaine.com:8080`

## 🌐 Accès aux applications

### Avec ports alternatifs :
- **Web** : `http://votre-domaine.com:8080` ou `https://votre-domaine.com:8443`
- **API** : `http://votre-domaine.com:4001` (direct) ou via Traefik
- **Admin** : `http://votre-domaine.com:4002` (direct) ou via Traefik
- **Traefik Dashboard** : `http://votre-domaine.com:8082`

### Variables minimales requises :
```bash
DOMAIN=votre-domaine.com
POSTGRES_PASSWORD=mot-de-passe-securise
REDIS_PASSWORD=autre-mot-de-passe
JWT_SECRET=cle-jwt-tres-longue
NEXTAUTH_SECRET=cle-nextauth-longue
```

## 🔧 Test de connectivité

Après déploiement, testez :
```bash
# Health checks
curl http://votre-domaine.com:4001/api/health  # API
curl http://votre-domaine.com:4000             # Web
curl http://votre-domaine.com:8082             # Traefik Dashboard
```

## ⚠️ Notes importantes

1. **Port 80/443** : Évités pour éviter les conflits avec Dokploy
2. **Variables par défaut** : Changez les mots de passe par défaut !
3. **SSL/TLS** : Fonctionnera via les ports alternatifs 8443
4. **Simplification** : Version Dokploy sans monitoring (Prometheus/Grafana)

Cette configuration devrait résoudre les conflits de ports et variables manquantes ! 🎉