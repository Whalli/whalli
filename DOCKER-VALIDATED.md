# 🐳 Configuration Docker - Guide Simplifié

## ✅ Configuration actuelle validée

Après tests complets, voici la configuration Docker opérationnelle :

### Services déployés
- **Backend NestJS** : ✅ Testé et fonctionnel
  - Port : `http://localhost:4000`
  - Hot-reload : ✅ Activé
  - Base de données : ✅ Connectée
  
- **PostgreSQL 16** : ✅ Fonctionnel
  - Port : `localhost:5432`

## 🚀 Démarrage (testé)

```bash
# 1. Variables d'environnement
cp .env.example .env
# Éditer JWT_SECRET et JWT_REFRESH_SECRET (min 32 caractères)

# 2. Démarrer
docker compose up -d

# 3. Vérifier
curl http://localhost:4000/health
```

## 📝 Stack technique

### Backend
- **Image** : `node:20-alpine` + OpenSSL 3.0
- **Package manager** : pnpm
- **Runtime dev** : nodemon + ts-node
- **Prisma** : binaryTarget `linux-musl-arm64-openssl-3.0.x`

### Volumes actifs
```yaml
- ./apps/backend/src:/app/apps/backend/src  # Hot-reload
- ./packages:/app/packages                   # Packages partagés
```

## ✅ Tests effectués

1. ✅ Build du backend réussi
2. ✅ Démarrage sans erreur
3. ✅ Connexion PostgreSQL OK
4. ✅ API répond (`/health` retourne 200)
5. ✅ Hot-reload fonctionne (modification détectée et rechargée)

## 🔧 Commandes validées

```bash
# Build
docker compose build backend

# Logs en temps réel
docker compose logs backend -f

# Redémarrage
docker compose restart backend

# Arrêt propre
docker compose down
```

## 🎯 Configuration Prisma

**Important** : Le schema.prisma doit inclure :
```prisma
generator client {
  provider      = "prisma-client-js"
  output        = "./generated/client"
  binaryTargets = ["native", "linux-musl-arm64-openssl-3.0.x"]
}
```

## 📦 Fichiers clés

- `apps/backend/Dockerfile` : Configuration Docker backend
- `apps/backend/nodemon.json` : Configuration hot-reload
- `docker-compose.yml` : Orchestration services
- `.env.example` : Template variables d'environnement
- `packages/prisma/schema.prisma` : Schéma avec binaryTargets

## ⚠️ Points d'attention

1. **OpenSSL** : Alpine nécessite `apk add --no-cache openssl`
2. **Prisma binary** : Doit correspondre à la version OpenSSL d'Alpine
3. **tsconfig.json** : Doit être copié dans le Dockerfile
4. **nodemon** : Doit être installé en devDependency

## 🎉 Résultat

Configuration **simple, efficace et testée** prête pour le développement !
