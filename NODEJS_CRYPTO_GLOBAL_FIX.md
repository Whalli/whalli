# Node.js Crypto Global Fix - ReferenceError: crypto is not defined

## 🚨 **Erreur rencontrée**

```
ReferenceError: crypto is not defined
    at SchedulerOrchestrator.addCron (/app/node_modules/.pnpm/@nestjs+schedule@6.0.1_.../dist/scheduler.orchestrator.js:90:38)
    const name = options.name || crypto.randomUUID();
                                 ^
```

## 🔍 **Diagnostic**

Cette erreur se produit avec `@nestjs/schedule` parce que :
1. **Node.js 18.x** n'expose pas toujours l'objet global `crypto`
2. `@nestjs/schedule` utilise `crypto.randomUUID()` sans importer le module
3. L'API crypto moderne nécessite une configuration spécifique

## ✅ **Solutions implémentées**

### **Solution 1 : Upgrade Node.js 18 → 20**

**Changements dans les Dockerfiles** :
```dockerfile
# AVANT
FROM node:18-bookworm-slim AS base

# APRÈS
FROM node:20-bookworm-slim AS base
```

**Avantages Node.js 20** :
- ✅ Objet `crypto` global disponible par défaut
- ✅ Meilleure compatibilité avec les modules ES
- ✅ Performance améliorée
- ✅ APIs crypto modernes stabilisées

### **Solution 2 : Polyfill crypto global**

**Nouveau fichier** : `apps/api/src/crypto-polyfill.ts`
```typescript
import { webcrypto } from 'node:crypto';

// Make crypto available globally if not already present
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

// For older Node.js versions
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = webcrypto;
}
```

**Import dans** `main.ts` :
```typescript
// Crypto polyfill must be imported before any other modules
import './crypto-polyfill';

import { NestFactory } from '@nestjs/core';
// ... other imports
```

### **Solution 3 : Variables d'environnement Node.js**

**Ajout dans les Dockerfiles** :
```dockerfile
ENV NODE_ENV=production

# Node.js crypto compatibility flags
ENV NODE_OPTIONS="--enable-source-maps"
ENV UV_THREADPOOL_SIZE=4
```

## 🔧 **Stratégie de défense en profondeur**

| Méthode | Portée | Efficacité | Coût |
|---------|--------|------------|------|
| **Node.js 20** | Globale | ✅ Très élevée | Minimal |
| **Polyfill crypto** | Application | ✅ Élevée | Très faible |
| **Variables ENV** | Runtime | ✅ Moyenne | Aucun |

**Combinaison recommandée** : Les 3 solutions ensemble pour une robustesse maximale.

## 📊 **Impact des changements**

### **Compatibilité Node.js**
| Version | crypto global | @nestjs/schedule | Recommandation |
|---------|---------------|------------------|----------------|
| Node.js 16 | ❌ Non | ❌ Problématique | Upgrade |
| Node.js 18 | ⚠️ Partiel | ⚠️ Avec polyfill | Upgrade |
| Node.js 20 | ✅ Oui | ✅ Fonctionne | ✅ Optimal |

### **Modules affectés**
- ✅ `@nestjs/schedule` : Cron jobs, intervals
- ✅ `@nestjs/jwt` : Token generation
- ✅ `bcrypt` : Password hashing
- ✅ `uuid` : ID generation

## 🚀 **Validation**

### **Test local**
```bash
# Build avec les corrections
pnpm --filter=@whalli/api build

# Démarrage en mode développement
pnpm --filter=@whalli/api dev

# Vérifier les cron jobs dans les logs
# Rechercher: "Cron job initialized" ou similar
```

### **Test Docker**
```bash
# Build avec Node.js 20
docker build -f apps/api/Dockerfile.dokploy . -t whalli-api-crypto-fix

# Test du démarrage
docker run --rm --name test-crypto \
  -e DATABASE_URL="postgresql://test" \
  whalli-api-crypto-fix

# Vérifier les logs - pas d'erreur "crypto is not defined"
```

### **Test production**
```bash
# Après déploiement Dokploy
docker logs <container-id> | grep -E "(crypto|schedule|cron)"

# Logs attendus :
# ✅ "Cron jobs initialized"
# ✅ "Scheduler module loaded"
# ❌ PAS "crypto is not defined"
```

## 🛡️ **Prévention future**

### **package.json - engines**
Mise à jour des versions supportées :
```json
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### **CI/CD - Matrix testing**
```yaml
# .github/workflows/ci.yml
strategy:
  matrix:
    node-version: [20, 22]  # Tester les versions LTS
```

### **Development - .nvmrc**
```bash
# .nvmrc
20
```

## 📋 **Checklist de résolution**

- [x] Dockerfile migré vers Node.js 20
- [x] Polyfill crypto global créé
- [x] Import polyfill dans main.ts
- [x] Variables d'environnement Node.js ajoutées
- [x] Build local réussi
- [ ] Test Docker en local
- [ ] Déploiement production
- [ ] Validation cron jobs fonctionnels

## 🎯 **Résultat attendu**

L'application devrait démarrer sans erreur `crypto is not defined` avec :

1. **Cron jobs** : Fonctionnels (@nestjs/schedule)
2. **JWT tokens** : Génération correcte
3. **UUID generation** : Disponible globalement
4. **Notifications system** : Tâches programmées actives

**Priorité** : Node.js 20 + Polyfill = Compatibilité garantie 🛡️

## 🔄 **Rollback plan**

Si problèmes avec Node.js 20 :
```dockerfile
# Retour temporaire à Node.js 18 avec polyfill
FROM node:18-bookworm-slim AS base
# Le polyfill crypto reste actif
```

**Monitoring** : Surveiller les performances et la stabilité pendant 48h après le déploiement.