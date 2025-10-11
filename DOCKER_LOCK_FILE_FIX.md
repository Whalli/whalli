# Docker Lock File Fix - pnpm-lock.yaml Not Found

## 🚨 **Erreur**

```
ERROR: failed to calculate checksum of ref 74715172-100f-4f88-96cb-07c2400abad3::uwvavoljndfl85akn3dwllmfb: "/pnpm-lock.yaml": not found
```

## 🔍 **Diagnostic**

Cette erreur se produit lors des builds Docker quand :
1. Le `pnpm-lock.yaml` est manquant du repository
2. Le Dockerfile essaie de copier ce fichier
3. Docker ne peut pas calculer le checksum d'un fichier inexistant

## ✅ **Solution**

### 1. **Regénérer le pnpm-lock.yaml**

```bash
# Installer les dépendances pour regénérer le lockfile
pnpm install

# Vérifier que le fichier existe
ls -la pnpm-lock.yaml
```

### 2. **Committer le fichier**

```bash
# Ajouter le lockfile à Git
git add pnpm-lock.yaml

# Committer avec un message descriptif
git commit -m "fix(deps): regenerate pnpm-lock.yaml for Docker builds"

# Pousser sur le repository
git push origin main
```

### 3. **Vérifier le contenu**

```bash
# Vérifier que les overrides sont présents
grep -A 2 -B 2 "overrides" pnpm-lock.yaml

# Vérifier les dépendances forcées
grep "pdfjs-dist" pnpm-lock.yaml
```

## 🔧 **Prévention**

### **Pourquoi ne pas ignorer pnpm-lock.yaml ?**

```gitignore
# ❌ NE PAS FAIRE - ne pas ignorer le lockfile
pnpm-lock.yaml
```

Le `pnpm-lock.yaml` doit être commité car :
- **Builds reproductibles** : Garantit les mêmes versions en production
- **Docker compatibility** : Nécessaire pour le cache des layers Docker
- **Team sync** : Assure que toute l'équipe utilise les mêmes versions
- **Overrides** : Contient les versions forcées (ex: pdfjs-dist@4.7.76)

### **Structure Docker optimisée**

```dockerfile
# Copier les fichiers de dépendances en premier (pour le cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Installer les dépendances
RUN pnpm install --frozen-lockfile --prod
```

## 📊 **Impact de la correction**

### **Avant (❌ Erreur)**
```
Building step 3/12: COPY package.json pnpm-lock.yaml...
ERROR: "/pnpm-lock.yaml": not found
Build failed ❌
```

### **Après (✅ Succès)**
```
Building step 3/12: COPY package.json pnpm-lock.yaml...
COPY completed successfully
Dependencies cached and installed ✅
Build successful ✅
```

## 🚀 **Validation**

### **Test local**
```bash
# Construire l'image API
docker build -f apps/api/Dockerfile . -t whalli-api

# Construire l'image Web
docker build -f apps/web/Dockerfile . -t whalli-web

# Construire l'image Admin
docker build -f apps/admin/Dockerfile . -t whalli-admin
```

### **Déploiement Dokploy**

1. **Push du code** : Le lockfile est maintenant disponible
2. **Build automatique** : Dokploy peut accéder au fichier
3. **Déploiement** : Les builds Docker réussissent

## 📋 **Checklist de résolution**

- [x] Regénérer `pnpm-lock.yaml` avec `pnpm install`
- [x] Vérifier que le fichier contient les overrides
- [x] Committer et pousser le fichier
- [x] Tester les builds Docker localement
- [ ] Redéployer sur Dokploy
- [ ] Vérifier que l'application démarre correctement

## 🎯 **Résolution finale**

**Commit**: `0c12ff1` - fix(deps): regenerate pnpm-lock.yaml with pdfjs-dist@4.7.76

L'erreur Docker est maintenant résolue. Le `pnpm-lock.yaml` est présent avec :
- Toutes les dépendances verrouillées
- Les overrides pour `pdfjs-dist@4.7.76`
- La compatibilité ESM/CommonJS assurée

**Prochaine étape** : Redéployer sur Dokploy pour validation complète.