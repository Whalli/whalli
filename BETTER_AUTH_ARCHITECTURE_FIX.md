# Better-Auth Architecture Fix - Database Schema & Configuration

## 🔍 **Problème identifié**

L'architecture d'authentification n'était pas correctement configurée :
1. **Tables manquantes** : Better-Auth nécessite des tables spécifiques (`user`, `session`, `account`, `verification`)
2. **Mauvaise architecture** : L'app web avait un accès direct à la base de données
3. **Configuration incorrecte** : Better-Auth côté web utilisait Prisma directement

## ✅ **Architecture correcte**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │   API Backend   │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│ Better-Auth     │◄──►│ Better-Auth     │◄──►│ Better-Auth     │
│ (Memory Only)   │    │ (Prisma Adapter)│    │ Tables          │
│                 │    │                 │    │                 │
│ Session Cookies │    │ Session         │    │ user            │
│ UI Components   │    │ Validation      │    │ session         │
│                 │    │ User Management │    │ account         │
└─────────────────┘    └─────────────────┘    │ verification    │
                                               └─────────────────┘
```

## 🗄️ **Tables Better-Auth ajoutées**

### **Migration applied** : `20251014090216_better_auth_tables`

```sql
-- User table (compatible Better-Auth)
CREATE TABLE "user" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Session table
CREATE TABLE "session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

-- Account table (OAuth providers)
CREATE TABLE "account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3),
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

-- Verification table (email verification, password reset)
CREATE TABLE "verification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 **Configuration mise à jour**

### **API Backend** (`apps/api/src/lib/auth.ts`)

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  
  baseURL: process.env.API_URL || "http://localhost:4001",
  secret: process.env.JWT_SECRET!,
  
  session: {
    storeSessionInDatabase: true, // ✅ Vraie DB
  },
  
  socialProviders: {
    google: { /* config */ },
    github: { /* config */ },
  },
});
```

### **Web Frontend** (`apps/web/src/lib/auth-server.ts`)

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: {
    provider: "memory", // ✅ Pas de DB directe
  },
  
  session: {
    storeSessionInDatabase: false, // ✅ Cookies uniquement
  },
  
  // Frontend délègue tout à l'API
});
```

## 🔄 **Flux d'authentification**

### **1. Login/Register**
```
Web Frontend → POST /api/auth/login → API Better-Auth → PostgreSQL
```

### **2. Session Validation**
```
Web Frontend (cookie) → API AuthGuard → GET /api/auth/session → Validation
```

### **3. Protected Routes**
```
Frontend cookie → API AuthGuard → Prisma Session lookup → Allow/Deny
```

## 📊 **Responsabilités par couche**

| Composant | Responsabilité | Base de données |
|-----------|----------------|------------------|
| **Web Frontend** | UI, Cookie management, Client auth | Aucune ❌ |
| **API Backend** | Session validation, User management | PostgreSQL ✅ |
| **AuthGuard** | Route protection, Token validation | Via API calls |

## 🚀 **Validation**

### **1. Vérifier les tables**
```sql
-- Connexion à PostgreSQL
\dt

-- Doit afficher :
-- user
-- session  
-- account
-- verification
```

### **2. Test de configuration**
```bash
# Build réussi
pnpm --filter=@whalli/api build
pnpm --filter=@whalli/web build

# Pas d'erreur de schéma Prisma côté web
```

### **3. Test d'authentification**
1. **Créer un compte** sur l'app web
2. **Vérifier en DB** : Enregistrement dans `user` table
3. **Login** : Session créée dans `session` table
4. **API calls** : AuthGuard valide via API Better-Auth

## 📋 **Avantages de cette architecture**

### **✅ Séparation des responsabilités**
- Frontend : Interface utilisateur uniquement
- API : Logique métier et données
- Database : Single source of truth

### **✅ Sécurité**
- Pas d'accès direct DB depuis le frontend
- Validation centralisée côté API
- Session management via cookies sécurisés

### **✅ Scalabilité**
- Frontend peut être déployé séparément
- API peut servir plusieurs frontends
- Database schema centralisé

## 🔄 **Migration effectuée**

- [x] Tables Better-Auth ajoutées au schéma API
- [x] Migration appliquée : `20251014090216_better_auth_tables`
- [x] Configuration web corrigée (memory provider)
- [x] Configuration API créée (Prisma adapter)
- [x] Schéma Prisma web supprimé
- [x] Architecture API-first établie

## 🎯 **Résultat**

L'authentification Better-Auth est maintenant correctement configurée avec :
- **Tables complètes** en base de données
- **Architecture API-first** respectée
- **Configuration appropriée** pour chaque couche
- **Sécurité renforcée** par la séparation des responsabilités

L'erreur d'authentification "Unauthorized" devrait être résolue ! 🎉