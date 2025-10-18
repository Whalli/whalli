# Architecture d'Authentification Corrigée

## Problème Identifié
L'authentification Better Auth s'exécutait entièrement dans le front-end (apps/web), ce qui viole les principes de sécurité car les opérations sensibles comme la création de comptes, la validation de mots de passe, et la gestion des sessions auraient dû être gérées par le backend.

## Solution Implémentée

### Architecture Correcte

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (apps/web)                    │
│  - React components (Login, Signup, Dashboard)              │
│  - Auth client (calls API endpoints)                         │
│  - Session management via cookies                            │
│  - Proxy: /api/auth/* → http://localhost:3001/auth/*        │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Requests
                     │ 
┌────────────────────▼────────────────────────────────────────┐
│                     Backend API (apps/api)                  │
│  - Better Auth Server                                       │
│  - AuthController proxies all requests to Better Auth       │
│  - Handles: sign-up, sign-in, session, CSRF, etc.          │
│  - Prisma ORM for database operations                       │
│  - PostgreSQL database                                      │
└─────────────────────────────────────────────────────────────┘
```

## Fichiers Modifiés

### 1. Backend: apps/api/src/auth/auth.controller.ts
**Changement**: Implémentation d'un proxy Better Auth
- Route wildcard `@All('*')` pour capturer tous les endpoints auth
- Transmet toutes les requêtes à Better Auth
- Préserve les headers (cookies, CSRF tokens)
- Gère les réponses correctement

**Endpoints exposés**:
- `POST /auth/sign-up/email` - Inscription
- `POST /auth/sign-in/email` - Connexion  
- `GET /auth/csrf` - Token CSRF
- `GET /auth/session` - Session actuelle
- `POST /auth/sign-out` - Déconnexion
- Et tous les autres endpoints Better Auth

### 2. Frontend: apps/web/src/lib/auth-server.ts
**Changement**: Suppression de Better Auth
- Fichier déprécié maintenu pour la compatibilité
- Plus d'instance Better Auth côté client
- Exporte uniquement les types TypeScript
- Les traitements d'authentification vont vers l'API

### 3. Frontend: apps/web/src/app/api/auth/[...all]/route.ts
**Changement**: Proxy simple vers l'API backend
- Nouvelle implémentation: proxy HTTP vers `http://localhost:3001/auth`
- Transmet tous les headers (cookies, CSRF tokens, etc.)
- Supporte tous les verbes HTTP (GET, POST, PUT, DELETE)
- Gère le forwarding des Set-Cookie headers

### 4. Frontend: apps/web/src/lib/auth-client.ts
**Changement**: À jour - utilise déjà Better Auth Client
- Le client appelle `/api/auth/*` (qui proxie vers l'API)
- Pas de modification nécessaire
- Fonctionne parfaitement avec la nouvelle architecture

## Flux d'Authentification

### Inscription (Sign Up)

```
1. User remplit le formulaire: email, password, name
   ↓
2. Frontend: signUp.email({ email, password, name })
   ↓
3. Client web: POST /api/auth/sign-up/email
   ↓
4. Proxy web: relaie vers http://localhost:3001/auth/sign-up/email
   ↓
5. Backend API: AuthController reçoit la requête
   ↓
6. Better Auth: crée l'utilisateur en base de données
   ↓
7. Réponse: user + session token (via cookie)
   ↓
8. Frontend: reçoit la session, redirige vers /dashboard
```

### Connexion (Sign In)

```
1. User remplit le formulaire: email, password
   ↓
2. Frontend: signIn.email({ email, password })
   ↓
3. Client web: POST /api/auth/sign-in/email
   ↓
4. Proxy web: relaie vers l'API
   ↓
5. Backend API: Better Auth valide les credentials
   ↓
6. Réponse: session token (via cookie)
   ↓
7. Frontend: middleware vérifie la session
```

## Avantages de cette Architecture

✅ **Sécurité**: Les opérations sensibles sont côté serveur
✅ **Séparation des responsabilités**: Frontend ≠ Backend auth
✅ **Scalabilité**: Facile d'ajouter d'autres clients (mobile, desktop)
✅ **Maintenance**: Un seul endroit pour gérer l'authentification
✅ **Audit**: Tous les événements d'auth sont côté serveur
✅ **Rate limiting**: Peut être appliqué au niveau de l'API
✅ **Validation**: Validation côté serveur = toujours de confiance

## Configuration Requise

### API (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### Web (.env)
```
DATABASE_URL=postgresql://... (pour prisma generate uniquement)
NEXTAUTH_SECRET=any-secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Tests

### Test CSRF
```bash
curl http://localhost:3001/auth/csrf
# Réponse: {"csrfToken":"..."}
```

### Test Inscription
```bash
CSRF=$(curl -s http://localhost:3001/auth/csrf | jq -r .csrfToken)
curl -X POST http://localhost:3001/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF" \
  -d '{"email":"user@example.com","password":"Pass@123","name":"User"}'
```

### Test Connexion
```bash
curl -X POST http://localhost:3001/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF" \
  -d '{"email":"user@example.com","password":"Pass@123"}'
```

## Prochaines Étapes

1. ✅ Migrer Better Auth vers l'API
2. ✅ Créer le proxy web
3. ✅ Nettoyer le code web
4. ⏳ Tester le flux complet (inscription → connexion → logout)
5. ⏳ Configurer OAuth (Google, GitHub)
6. ⏳ Ajouter la vérification d'email (optionnel)
7. ⏳ Implémenter le "forgot password"
