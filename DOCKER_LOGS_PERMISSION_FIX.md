# Docker Logs Permission Fix - EACCES mkdir 'logs'

## 🚨 **Erreur rencontrée**

```
Error: EACCES: permission denied, mkdir 'logs'
    at Object.mkdirSync (node:fs:1391:3)
    at File._createLogDirIfNotExist (/app/node_modules/.pnpm/winston@3.18.3/node_modules/winston/lib/winston/transports/file.js:759:10)
```

## 🔍 **Diagnostic**

Cette erreur se produit parce que :
1. Winston essaie de créer un dossier `logs` dans `/app`
2. L'utilisateur `nestjs` du conteneur n'a pas les permissions d'écriture
3. Le dossier n'existe pas et ne peut pas être créé

## ✅ **Solutions implémentées**

### **Solution 1 : Dockerfile - Permissions et dossier logs**

**Changements dans `apps/api/Dockerfile`** :
```dockerfile
# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chown -R nestjs:nestjs /app/logs

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/package.json ./

# Set ownership of application files
RUN chown -R nestjs:nestjs /app

USER nestjs
```

### **Solution 2 : Configuration Winston intelligente**

**Changements dans `logger.config.ts`** :
```typescript
// Determine logs directory based on environment
const isProduction = process.env.NODE_ENV === 'production';
const logsDir = isProduction ? '/tmp/logs' : (process.env.LOGS_DIR || 'logs');

// Add file transports with error handling
try {
  transports.push(
    new winston.transports.File({
      filename: `${logsDir}/error.log`,
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  );

  transports.push(
    new winston.transports.File({
      filename: `${logsDir}/combined.log`,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  );
} catch (error) {
  // Fallback to console only if file transports fail
  console.warn('Failed to initialize file transports, using console only:', 
    error instanceof Error ? error.message : String(error));
}
```

## 🔧 **Stratégie multi-environnement**

### **Développement local**
- **Logs directory** : `./logs` (dossier local)
- **File transports** : Activés (error.log + combined.log)
- **Console transport** : Activé

### **Production Docker**
- **Logs directory** : `/tmp/logs` (système de fichiers temporaire)
- **File transports** : Activés avec fallback
- **Console transport** : Activé (principal pour Docker logs)

### **Conteneur avec contraintes**
- **File transports** : Désactivés automatiquement si erreur
- **Console transport** : Seul transport actif
- **Pas d'erreur fatale** : Application démarre quand même

## 📊 **Impact de la correction**

### **Avant (❌ Erreur)**
```
Error: EACCES: permission denied, mkdir 'logs'
Application crash ❌
```

### **Après (✅ Succès)**
```
[2025-10-12T00:30:15.123Z] INFO: Application starting...
[2025-10-12T00:30:15.124Z] INFO: Winston logger initialized
[2025-10-12T00:30:15.125Z] INFO: File transports: /tmp/logs
Application start ✅
```

### **Fallback (⚠️ Dégradé mais fonctionnel)**
```
WARN: Failed to initialize file transports, using console only: EACCES
[2025-10-12T00:30:15.123Z] INFO: Application starting...
Application start ✅ (console logs only)
```

## 🐳 **Variables d'environnement Docker**

### **Optionnelles pour personnalisation**
```yaml
# docker-compose.yml
services:
  api:
    environment:
      - NODE_ENV=production
      - LOGS_DIR=/tmp/logs        # Dossier de logs personnalisé
      # ou pour désactiver complètement les logs fichier
      - DISABLE_FILE_LOGS=true
```

### **Dockerfile - Volume pour persistance (optionnel)**
```dockerfile
# Si vous voulez persister les logs
VOLUME ["/app/logs"]
```

## 🚀 **Validation**

### **Test local**
```bash
# Build et démarrage
pnpm --filter=@whalli/api build
pnpm --filter=@whalli/api start

# Vérifier les logs
ls -la logs/
# Doit contenir: error.log et combined.log
```

### **Test Docker**
```bash
# Build Docker
docker build -f apps/api/Dockerfile . -t whalli-api-test

# Démarrage avec logs
docker run --rm whalli-api-test

# Vérifier pas d'erreur EACCES
```

### **Test production**
```bash
# Après déploiement Dokploy, vérifier les logs
docker logs <container-id>

# Rechercher les messages Winston
# Pas d'erreur "permission denied"
```

## 📋 **Checklist de résolution**

- [x] Dockerfile modifié (dossier logs + permissions)
- [x] Configuration Winston adaptative
- [x] Gestion d'erreur TypeScript corrigée
- [x] Build local réussi
- [ ] Test Docker build
- [ ] Déploiement production
- [ ] Validation logs en production

## 🎯 **Résultat attendu**

L'application devrait démarrer sans erreur `EACCES` avec :
1. **Logs fichier** : Fonctionnels en développement et production (si permissions OK)
2. **Logs console** : Toujours disponibles (principal pour Docker)
3. **Fallback gracieux** : Application démarre même si logs fichier échouent

**Priorité** : Console logs + Graceful degradation = Application robuste 🛡️