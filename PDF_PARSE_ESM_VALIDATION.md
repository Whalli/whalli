# PDF Parse ESM Fix - Validation Guide

## 🎯 **Solution appliquée**

### **Dual Package Override Strategy**
```json
{
  "pnpm": {
    "overrides": {
      "pdfjs-dist": "4.7.76",
      "pdf-parse": "1.1.1"
    }
  }
}
```

## ✅ **Validation en local**

### **1. Vérifier les versions installées**
```bash
# Vérifier pdf-parse version
grep -A 5 "pdf-parse@1.1.1" pnpm-lock.yaml

# Vérifier pdfjs-dist version  
grep -A 5 "pdfjs-dist@4.7.76" pnpm-lock.yaml

# Voir les overrides appliqués
grep -A 3 "overrides:" pnpm-lock.yaml
```

**Résultat attendu** :
```yaml
overrides:
  pdfjs-dist: 4.7.76
  pdf-parse: 1.1.1
```

### **2. Vérifier la compatibilité CommonJS**
```bash
# pdf-parse@1.1.1 utilise require(), pas import
grep -n "require\|import" "node_modules/.pnpm/pdf-parse@1.1.1/node_modules/pdf-parse/lib/pdf-parse.js"

# Doit montrer:
# 63:    PDFJS = PDFJS ? PDFJS : require(`./pdf.js/${options.version}/build/pdf.js`);
```

### **3. Test de build local**
```bash
# Build réussi
pnpm --filter=@whalli/api build
```

**✅ Status** : Tous les tests locaux réussissent

## 🐳 **Validation Docker**

### **1. Test des builds Docker**
```bash
# Build API
docker build -f apps/api/Dockerfile . -t whalli-api-test

# Build Web  
docker build -f apps/web/Dockerfile . -t whalli-web-test

# Build Admin
docker build -f apps/admin/Dockerfile . -t whalli-admin-test
```

### **2. Test de démarrage avec PDF**
```bash
# Démarrer le container API
docker run -d --name api-test \
  -e DATABASE_URL="postgresql://test" \
  -e REDIS_URL="redis://test" \
  whalli-api-test

# Vérifier les logs (pas d'erreur ERR_REQUIRE_ESM)
docker logs api-test

# Nettoyer
docker rm -f api-test
```

## 🚀 **Validation Dokploy**

### **1. Redéploiement**
1. **Code poussé** : Commit `9da9f6a` contient la solution
2. **Déployer sur Dokploy** : Pull des derniers changements
3. **Observer les logs** : Plus d'erreur ERR_REQUIRE_ESM

### **2. Logs à surveiller**

**❌ Avant (erreur)** :
```
Error [ERR_REQUIRE_ESM]: require() of ES Module 
/app/node_modules/.pnpm/pdfjs-dist@4.7.76/node_modules/pdfjs-dist/legacy/build/pdf.mjs not supported
```

**✅ Après (succès)** :
```
[Nest] Application successfully started
[Nest] FilesService initialized
[Nest] PDF extraction available
```

### **3. Test fonctionnel**

**Test d'upload PDF** :
```bash
# Via API REST
curl -X POST http://your-domain/api/files/upload \
  -F "file=@test.pdf" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Réponse attendue:
{
  "id": "...",
  "filename": "test.pdf",
  "metadata": {
    "extractedText": "Contenu du PDF..."
  }
}
```

## 📊 **Comparaison versions**

| Package | Version problématique | Version fixe | Raison |
|---------|---------------------|--------------|---------|
| pdfjs-dist | 5.4.149 (ESM-only) | 4.7.76 (CommonJS) | Compatibilité require() |
| pdf-parse | 2.2.9 (importe ESM) | 1.1.1 (pure CommonJS) | Pas d'import ES Module |

## 🔧 **Architecture de la solution**

```
pdf-parse@1.1.1 (CommonJS)
    ↓ require()
pdfjs-dist@4.7.76/legacy/build/pdf.js (CommonJS)
    ↓ Compatible
Node.js require() system ✅
```

**vs. Problème initial** :
```
pdf-parse@2.2.9 (CommonJS)
    ↓ require()
pdfjs-dist@5.x/legacy/build/pdf.mjs (ES Module)
    ↓ ❌ ERR_REQUIRE_ESM
Node.js require() system ❌
```

## ✅ **Checklist de validation**

- [x] pnpm-lock.yaml contient les overrides
- [x] pdf-parse@1.1.1 installé
- [x] pdfjs-dist@4.7.76 installé  
- [x] Build local réussit
- [x] Client Prisma généré
- [x] Commit et push effectués
- [ ] Build Docker réussi (à tester en production)
- [ ] Déploiement Dokploy sans erreur
- [ ] Test fonctionnel PDF extraction
- [ ] Monitoring logs production

## 🎉 **Résultat attendu**

L'erreur `ERR_REQUIRE_ESM` devrait être complètement résolue avec cette approche dual-downgrade. Les deux packages utilisent maintenant CommonJS de bout en bout.

**Commit de la solution** : `9da9f6a` - fix(pdf-parse): downgrade to pdf-parse@1.1.1 for ESM compatibility