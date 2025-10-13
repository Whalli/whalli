# Chat Authentication Debug Guide - "Unauthorized" Error

## 🚨 **Erreur rencontrée**

```
Failed to send message: Error: Failed to start chat: Unauthorized
    at eval (useChat.ts:149:17)
    at async handleSendMessage (ChatUI.tsx:80:5)
```

## 🔍 **Diagnostic**

Cette erreur indique que l'API ne peut pas valider la session utilisateur lors de l'envoi de messages dans le chat.

### **Flux d'authentification**
1. **Frontend** : useChat.ts envoie POST `/api/chat/start` avec `credentials: 'include'`
2. **API** : AuthGuard extrait le token des cookies ou headers
3. **Validation** : AuthGuard valide la session avec Better-Auth via `AUTH_API_URL`
4. **Échec** : La validation échoue → "Unauthorized"

## ✅ **Solutions implémentées**

### **Solution 1 : Configuration AUTH_API_URL**

**Problème** : L'API ne sait pas où se trouve le service Better-Auth

**Correction** dans `docker-compose.yml` :
```yaml
api:
  environment:
    # Better-Auth integration (internal service communication)
    AUTH_API_URL: http://web:3000
```

**Correction** dans `docker-compose.prod.yml` :
```yaml
api:
  environment:
    # Better-Auth integration (internal service communication)
    AUTH_API_URL: http://web:4000
```

### **Solution 2 : Logs de debug étendus**

**Amélioration** de `auth.guard.ts` :
```typescript
console.log('[AuthGuard] AUTH_API_URL:', this.AUTH_API_URL);
console.log('[AuthGuard] Token found:', !!token);
console.log('[AuthGuard] Validating session at:', sessionUrl);
console.log('[AuthGuard] Session validation response status:', response.status);
```

## 🔧 **Vérifications à effectuer**

### **1. Configuration réseau Docker**

**Vérifier les services** :
```bash
# Lister les conteneurs
docker ps

# Vérifier la communication interne
docker exec whalli-api ping web
# Doit réussir si les services sont sur le même réseau
```

### **2. Variables d'environnement**

**Dans les logs API, rechercher** :
```
[AuthGuard] AUTH_API_URL: http://web:3000
```

**Si AUTH_API_URL = "http://localhost:3000"** → ❌ Configuration manquante

### **3. Endpoint Better-Auth disponible**

**Tester depuis l'API** :
```bash
# Depuis le conteneur API
docker exec -it whalli-api curl http://web:3000/api/auth/session
```

**Réponse attendue** : Status 401 (car pas de token), mais pas "Connection refused"

### **4. Cookies de session présents**

**Dans les DevTools du navigateur** :
- **Application → Cookies** 
- Rechercher : `better-auth.session_token`
- Vérifier : Domain correct, pas expiré

## 📊 **Scénarios de debug**

### **Scénario 1 : AUTH_API_URL incorrect**
```
[AuthGuard] AUTH_API_URL: http://localhost:3000
[AuthGuard] Session validation exception: fetch failed
```
**Solution** : Corriger l'URL vers le service web interne

### **Scénario 2 : Pas de token**
```
[AuthGuard] Token found: false
[AuthGuard] No token found in request
```
**Solution** : Vérifier l'authentification côté frontend

### **Scénario 3 : Service web inaccessible**
```
[AuthGuard] AUTH_API_URL: http://web:3000
[AuthGuard] Session validation exception: Connection refused
```
**Solution** : Vérifier que le service web est démarré

### **Scénario 4 : Session expirée**
```
[AuthGuard] Session validation response status: 401
[AuthGuard] Session validation error: Unauthorized
```
**Solution** : Relogin utilisateur requis

## 🚀 **Validation des corrections**

### **Étape 1 : Redéploiement**
```bash
# Redéployer avec la nouvelle configuration
docker-compose up -d --build api

# Ou sur Dokploy : déclencher un nouveau build
```

### **Étape 2 : Vérifier les logs**
```bash
# Surveiller les logs API
docker logs -f whalli-api

# Rechercher les messages AuthGuard lors d'un test de chat
```

### **Étape 3 : Test fonctionnel**
1. **Se connecter** sur l'application web
2. **Aller dans le chat** et envoyer un message
3. **Vérifier les logs** : Pas d'erreur "Unauthorized"

### **Logs de succès attendus** :
```
[AuthGuard] AUTH_API_URL: http://web:3000
[AuthGuard] Token found: true
[AuthGuard] Validating session at: http://web:3000/api/auth/session
[AuthGuard] Session validation response status: 200
[AuthGuard] Session data received: true
[AuthGuard] Authentication successful for user: user_xyz
```

## 📋 **Checklist de résolution**

- [x] AUTH_API_URL ajouté aux docker-compose
- [x] Logs de debug ajoutés à AuthGuard
- [x] Validation TypeScript corrigée
- [ ] Configuration déployée en production
- [ ] Test de communication inter-services
- [ ] Validation du chat fonctionnel

## 🎯 **Causes les plus probables**

1. **🥇 AUTH_API_URL manquant** (90% des cas)
   - L'API ne peut pas joindre le service Better-Auth
   
2. **🥈 Service web non démarré** (5% des cas)
   - Docker compose pas complètement up
   
3. **🥉 Session expirée** (5% des cas)
   - Utilisateur doit se reconnecter

## 🔄 **Prochaines étapes**

1. **Déployer** les corrections de configuration
2. **Tester** l'authentification avec les logs
3. **Nettoyer** les logs de debug une fois le problème résolu

**Résultat attendu** : Le chat devrait fonctionner sans erreur "Unauthorized" ! 🎉