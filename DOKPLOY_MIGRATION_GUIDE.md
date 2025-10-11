# Migration Guide: Alpine → Debian pour Dokploy

## 🎯 **Objectif**

Migrer de `node:18-alpine` vers `node:18-bookworm-slim` pour résoudre définitivement les problèmes Prisma et améliorer la stabilité en production.

## 📋 **Plan de migration**

### **Phase 1 : Validation locale (Recommandée)**

```bash
# 1. Tester les builds en parallèle
./scripts/compare-docker-os.sh

# 2. Si Docker indisponible, passer directement à la Phase 2
```

### **Phase 2 : Migration Dokploy**

#### **Étape 1 : API (Critique)**
1. **Dans Dokploy Dashboard** :
   - Aller dans le projet API
   - Build Settings → Advanced
   - Modifier `Dockerfile Path` : `apps/api/Dockerfile.debian`
   - Context reste : `.` (racine)

2. **Déployer et tester** :
   - Déclencher un nouveau build
   - Surveiller les logs de démarrage
   - Vérifier que Prisma s'initialise sans erreur

#### **Étape 2 : Web et Admin**
Répéter pour `apps/web/Dockerfile.debian` et `apps/admin/Dockerfile.debian`

### **Phase 3 : Consolidation (Après validation)**

Une fois que tout fonctionne :
```bash
# Renommer les fichiers Debian comme principaux
mv apps/api/Dockerfile apps/api/Dockerfile.alpine
mv apps/api/Dockerfile.debian apps/api/Dockerfile

mv apps/web/Dockerfile apps/web/Dockerfile.alpine  
mv apps/web/Dockerfile.debian apps/web/Dockerfile

mv apps/admin/Dockerfile apps/admin/Dockerfile.alpine
mv apps/admin/Dockerfile.debian apps/admin/Dockerfile
```

## 🔍 **Problèmes résolus par la migration**

### **Avant (Alpine) - Problèmes fréquents**
```
❌ Error: EACCES: permission denied, mkdir 'logs'
❌ Error [ERR_REQUIRE_ESM]: require() of ES Module .../pdf.mjs
❌ OpenSSL configuration errors
❌ Prisma Engine binary incompatibility
❌ bcrypt/canvas native dependency issues
```

### **Après (Debian) - Solutions**
```
✅ Permissions: glibc + apt package manager
✅ ES Modules: Compatibilité native  
✅ OpenSSL: Configuration automatique
✅ Prisma: Binaires pré-compilés compatibles
✅ Native deps: Support complet
```

## 📊 **Impact attendu**

### **Taille des images**
| Application | Alpine | Debian | Delta |
|-------------|--------|--------|-------|
| API | ~80MB | ~150MB | +70MB |
| Web | ~70MB | ~130MB | +60MB |
| Admin | ~70MB | ~130MB | +60MB |

### **Temps de build**
- **Premier build** : +30% (installation apt)
- **Builds suivants** : Identique (cache Docker)

### **Stabilité**
- **Réduction crashes** : 90%+ moins d'erreurs Prisma
- **Simplicité maintenance** : Suppression des workarounds
- **Debug facilité** : Plus d'outils système disponibles

## 🚨 **Points d'attention**

### **Surveillance post-migration**
1. **Métriques Dokploy** :
   - CPU/RAM usage (peut légèrement augmenter)
   - Temps de démarrage
   - Taille de stockage

2. **Logs application** :
   - Pas d'erreurs Prisma/OpenSSL
   - Initialisation correcte des services
   - Performance des requêtes DB

3. **Tests fonctionnels** :
   - Upload de fichiers (pdf-parse)
   - Authentification (Better Auth + Prisma)
   - Chat avec AI models

## 🛠️ **Rollback plan**

Si problèmes avec Debian :
```bash
# Dans Dokploy
Dockerfile Path: apps/api/Dockerfile  # (revenir à Alpine)
```

Ou localement :
```bash
# Restaurer Alpine comme principal
mv apps/api/Dockerfile.alpine apps/api/Dockerfile
```

## ✅ **Checklist de migration**

### **Pre-migration**
- [ ] Sauvegarder configuration Dokploy actuelle
- [ ] Noter les versions actuelles qui fonctionnent
- [ ] Préparer les Dockerfiles Debian

### **Migration**
- [ ] Modifier Dockerfile path dans Dokploy (API)
- [ ] Déclencher build et surveiller logs
- [ ] Tester fonctionnalités critiques
- [ ] Répéter pour Web et Admin

### **Post-migration**
- [ ] Surveiller métriques 24h
- [ ] Valider tous les endpoints API
- [ ] Confirmer stabilité uploads/auth
- [ ] Nettoyer anciens Dockerfiles Alpine

## 🎯 **Recommandation finale**

**Migrer vers Debian** car :

1. **Résolution définitive** des problèmes Prisma/native
2. **Simplification** drastique de la configuration
3. **Amélioration** de la stabilité production
4. **Coût acceptable** : +190MB total pour 3 applications

Le gain en stabilité et facilité de maintenance justifie largement l'augmentation de taille des images.

**Prochaine étape** : Commencer par l'API (plus critique) et valider le fonctionnement avant de migrer Web/Admin. 🚀