# Guide Complet des Variables d'Environnement - Whalli

Documentation exhaustive de toutes les variables d'environnement utilisées dans le projet Whalli.

## 📋 Table des Matières

1. [Configuration du Domaine](#configuration-du-domaine)
2. [Base de Données](#base-de-données)
3. [Cache Redis](#cache-redis)
4. [Stockage MinIO](#stockage-minio)
5. [Authentification](#authentification)
6. [OAuth Providers](#oauth-providers)
7. [Paiements Stripe](#paiements-stripe)
8. [API d'Intelligence Artificielle](#api-dintelligence-artificielle)
9. [Email SMTP](#email-smtp)
10. [Rate Limiting](#rate-limiting)
11. [Monitoring et Observabilité](#monitoring-et-observabilité)

---

## 🌐 Configuration du Domaine

### `DOMAIN`
**Type**: String  
**Requis**: ✅ Oui  
**Exemple**: `mydomain.com`

**Description**:  
Nom de domaine principal de votre application en production. Ce domaine sera utilisé comme base pour tous les sous-domaines (app, api, admin, etc.).

**Utilisation**:
- Configuration des routes Traefik
- Génération automatique des certificats SSL via Let's Encrypt
- Construction des URLs publiques pour les services

**Configuration DNS requise**:
```
Type  Nom              Valeur
A     @                123.45.67.89 (IP de votre serveur)
A     *                123.45.67.89 (wildcard pour sous-domaines)
```

**Sous-domaines générés automatiquement**:
- `app.mydomain.com` → Application web (Next.js)
- `api.mydomain.com` → API backend (NestJS)
- `admin.mydomain.com` → Panel d'administration
- `grafana.mydomain.com` → Dashboards Grafana
- `prometheus.mydomain.com` → Métriques Prometheus
- `storage.mydomain.com` → API S3 MinIO
- `minio.mydomain.com` → Console MinIO
- `traefik.mydomain.com` → Dashboard Traefik

---

### `ACME_EMAIL`
**Type**: Email  
**Requis**: ✅ Oui  
**Exemple**: `admin@mydomain.com`

**Description**:  
Adresse email utilisée pour l'enregistrement des certificats SSL Let's Encrypt. Vous recevrez des notifications importantes à cette adresse :
- Expiration des certificats (14 jours avant)
- Problèmes de renouvellement
- Changements de politique Let's Encrypt

**Bonnes pratiques**:
- Utiliser une adresse email professionnelle active
- Éviter les adresses personnelles temporaires
- S'assurer de pouvoir recevoir et lire ces emails

---

## 🗄️ Base de Données

### `DATABASE_URL`
**Type**: Connection String  
**Requis**: ✅ Oui  
**Format**: `postgresql://user:password@hostname/database?sslmode=require`  
**Exemple**: `postgresql://neondb_owner:AbCd1234@ep-cool-morning-12345678.us-east-2.aws.neon.tech/neondb?sslmode=require`

**Description**:  
URL de connexion complète à votre base de données PostgreSQL hébergée sur Neon (ou autre provider). Cette variable est utilisée par Prisma ORM pour toutes les opérations de base de données.

**Composants de l'URL**:
```
postgresql://  [user]  :  [password]  @  [hostname]  /  [database]  ?sslmode=require
    ↓           ↓           ↓              ↓              ↓              ↓
 Protocole   Utilisateur  Mot de passe   Serveur    Nom de la DB   SSL obligatoire
```

**Obtenir cette URL**:
1. Créer un compte sur [Neon](https://console.neon.tech/)
2. Créer un nouveau projet
3. Copier la "Connection String" depuis le dashboard
4. **Important**: Toujours inclure `?sslmode=require` à la fin

**Sécurité**:
- ⚠️ Ne JAMAIS commiter cette variable dans Git
- ✅ Utiliser des mots de passe forts générés aléatoirement
- ✅ Neon génère automatiquement des credentials sécurisés
- ✅ SSL est obligatoire pour toutes les connexions production

**Utilisation dans le code**:
- Prisma Client pour les requêtes
- Migrations de base de données
- Seeds de données initiales

---

## 💾 Cache Redis

### `REDIS_URL`
**Type**: Connection String  
**Requis**: ✅ Oui  
**Format**: `redis://:password@hostname:port/database`  
**Exemple**: `redis://:MySecurePass123@redis:6379/0`

**Description**:  
URL de connexion complète au serveur Redis utilisé pour le caching. Redis améliore considérablement les performances en mettant en cache les réponses des API d'IA et autres données fréquemment consultées.

**Composants de l'URL**:
```
redis://  :  [password]  @  [hostname]  :  [port]  /  [database]
   ↓          ↓              ↓              ↓           ↓
Protocole  Mot de passe   Nom du service  Port      DB numéro
```

**Performance Impact**:
- **Sans cache**: ~3 secondes par requête AI + coût API
- **Avec cache**: ~0.11 secondes + économie 99%
- **Amélioration**: 27x plus rapide

**Utilisation**:
- Cache des réponses AI identiques (TTL: 1h)
- Sessions utilisateur
- Rate limiting
- File d'attente BullMQ (transcription audio, recherches récurrentes)

---

### `REDIS_PASSWORD`
**Type**: String (32+ caractères)  
**Requis**: ✅ Oui  
**Génération**: `openssl rand -base64 32`  
**Exemple**: `K8mP3nR7tY9wQ2xZ5vB8nM4jH6gF1dS0`

**Description**:  
Mot de passe pour sécuriser l'accès à Redis. **Doit être identique** au mot de passe dans `REDIS_URL`.

**Importance**:
- Redis stocke des données sensibles (sessions, tokens)
- Accessible depuis plusieurs services (API, Workers)
- Protection contre les accès non autorisés

**Synchronisation**:
```bash
REDIS_PASSWORD=K8mP3nR7tY9wQ2xZ5vB8nM4jH6gF1dS0
REDIS_URL=redis://:K8mP3nR7tY9wQ2xZ5vB8nM4jH6gF1dS0@redis:6379/0
                      ↑ MÊME MOT DE PASSE ↑
```

---

## 📦 Stockage MinIO

### `MINIO_ROOT_USER`
**Type**: String (alphanumeric)  
**Requis**: ✅ Oui  
**Défaut**: `minioadmin` (⚠️ à changer en production)  
**Exemple**: `whalli-admin`

**Description**:  
Nom d'utilisateur administrateur pour accéder à la console MinIO. Utilisé pour la gestion des buckets, des politiques d'accès, et la configuration.

**Accès**:
- Console MinIO: `https://minio.yourdomain.com`
- Authentification: MINIO_ROOT_USER + MINIO_ROOT_PASSWORD

**Bonnes pratiques**:
- ❌ Ne PAS utiliser `minioadmin` en production
- ✅ Créer un nom unique et non-prédictible
- ✅ Utiliser un nom différent du nom de l'application

---

### `MINIO_ROOT_PASSWORD`
**Type**: String (32+ caractères)  
**Requis**: ✅ Oui  
**Génération**: `openssl rand -base64 32`  
**Exemple**: `X7nP9mR3tY5wQ8xZ2vB6nM1jH4gF7dS9`

**Description**:  
Mot de passe administrateur pour la console MinIO. Protège l'accès à la gestion complète du stockage S3.

**Sécurité**:
- Minimum 32 caractères recommandé
- Combinaison alphanumériques + caractères spéciaux
- Différent de tous les autres mots de passe

---

### `MINIO_BUCKET`
**Type**: String (lowercase, alphanumeric + hyphens)  
**Requis**: ✅ Oui  
**Défaut**: `whalli-uploads`  
**Exemple**: `whalli-uploads`

**Description**:  
Nom du bucket S3 où seront stockés tous les fichiers uploadés par les utilisateurs. Créé automatiquement au démarrage de MinIO si inexistant.

**Convention de nommage**:
- Lettres minuscules uniquement
- Chiffres autorisés
- Tirets autorisés (pas au début/fin)
- Pas d'underscores, espaces, ou caractères spéciaux

**Types de fichiers stockés**:
- Documents PDF (extraction de texte)
- Images (OCR)
- Fichiers audio (transcription)
- Avatars utilisateur
- Pièces jointes de messages

**Structure typique**:
```
whalli-uploads/
├── users/
│   └── {userId}/
│       ├── avatar.jpg
│       └── documents/
├── messages/
│   └── {messageId}/
│       └── attachments/
└── projects/
    └── {projectId}/
        └── files/
```

---

## 🔐 Authentification

### `JWT_SECRET`
**Type**: String (minimum 32 caractères)  
**Requis**: ✅ Oui  
**Génération**: `openssl rand -base64 32`  
**Exemple**: `Y3mP6nR9tK2wQ5xZ8vB1nM7jH4gF3dS0pL9aT6rE5iU8`

**Description**:  
Clé secrète utilisée pour signer et vérifier les tokens JWT (JSON Web Tokens). Critique pour la sécurité de l'authentification.

**Utilisation**:
- Signature des access tokens (courte durée: 15min)
- Signature des refresh tokens (longue durée: 7 jours)
- Vérification de l'authenticité des tokens
- Protection contre la falsification

**Sécurité CRITIQUE**:
- ⚠️ Si cette clé est compromise, TOUS les tokens sont invalides
- ⚠️ Changer cette clé déconnecte tous les utilisateurs
- ✅ Doit être unique par environnement (dev ≠ prod)
- ✅ Ne JAMAIS la partager ou la commiter
- ✅ Générer avec une source cryptographiquement sécurisée

**Rotation**:
En cas de compromission :
1. Générer une nouvelle clé
2. Mettre à jour la variable
3. Redémarrer tous les services
4. Tous les utilisateurs devront se reconnecter

---

### `BETTER_AUTH_SECRET`
**Type**: String (minimum 32 caractères)  
**Requis**: ✅ Oui  
**Génération**: `openssl rand -base64 32`  
**Exemple**: `Z8nP3mR6tY4wQ7xZ1vB9nM2jH5gF8dS3pL6aT9rE2iU5`

**Description**:  
Clé secrète pour la bibliothèque Better Auth utilisée pour l'authentification OAuth et la gestion des sessions. Différente de JWT_SECRET pour la séparation des responsabilités.

**Utilisation**:
- Chiffrement des cookies de session
- Signature des CSRF tokens
- Protection des redirections OAuth
- Stockage sécurisé des états OAuth

**Bonnes pratiques**:
- Différente de JWT_SECRET
- Même niveau de sécurité requis
- Changement entraîne la déconnexion de tous les utilisateurs

---

## 🔗 OAuth Providers

### GitHub OAuth

#### `GITHUB_CLIENT_ID`
**Type**: String  
**Requis**: ⚠️ Optionnel (si OAuth GitHub activé)  
**Format**: Alphanumeric  
**Exemple**: `Iv1.a629723d89abc123`

**Description**:  
Identifiant public de votre application OAuth GitHub. Permet aux utilisateurs de se connecter avec leur compte GitHub.

**Configuration**:
1. Aller sur [GitHub Developer Settings](https://github.com/settings/developers)
2. "New OAuth App"
3. Remplir :
   - **Application name**: `Whalli Production`
   - **Homepage URL**: `https://app.yourdomain.com`
   - **Authorization callback URLs**:
     ```
     https://app.yourdomain.com/api/auth/callback/github
     https://admin.yourdomain.com/api/auth/callback/github
     ```
4. Copier le "Client ID" généré

---

#### `GITHUB_CLIENT_SECRET`
**Type**: String (secret)  
**Requis**: ⚠️ Optionnel (si OAuth GitHub activé)  
**Exemple**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`

**Description**:  
Clé secrète de votre application OAuth GitHub. **Ne JAMAIS la partager ou la commiter.**

**Obtention**:
- Générée lors de la création de l'OAuth App
- Affichée une seule fois (bien la sauvegarder)
- Régénérable depuis les settings GitHub si perdue

**Sécurité**:
- Stockée uniquement en variable d'environnement
- Utilisée côté serveur uniquement
- Jamais exposée au client

---

### Google OAuth

#### `GOOGLE_CLIENT_ID`
**Type**: String  
**Requis**: ⚠️ Optionnel (si OAuth Google activé)  
**Format**: `xxxxx.apps.googleusercontent.com`  
**Exemple**: `123456789-abc123def456.apps.googleusercontent.com`

**Description**:  
Identifiant public de votre application OAuth Google. Permet aux utilisateurs de se connecter avec leur compte Google.

**Configuration**:
1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un existant
3. Activer l'API "Google+ API"
4. Aller dans "APIs & Services" → "Credentials"
5. "Create Credentials" → "OAuth 2.0 Client ID"
6. Type d'application: "Web application"
7. Authorized redirect URIs:
   ```
   https://app.yourdomain.com/api/auth/callback/google
   https://admin.yourdomain.com/api/auth/callback/google
   ```
8. Copier le "Client ID" généré

---

#### `GOOGLE_CLIENT_SECRET`
**Type**: String (secret)  
**Requis**: ⚠️ Optionnel (si OAuth Google activé)  
**Exemple**: `GOCSPX-abcdef123456_ABCDEF789`

**Description**:  
Clé secrète de votre application OAuth Google. Protège contre les utilisations non autorisées de votre OAuth app.

**Obtention**:
- Générée automatiquement avec le Client ID
- Visible dans la Google Cloud Console
- Régénérable si compromise

---

## 💳 Paiements Stripe

### `STRIPE_SECRET_KEY`
**Type**: String (secret)  
**Requis**: ✅ Oui (pour le système de billing)  
**Format**: `sk_live_` (production) ou `sk_test_` (test)  
**Exemple**: `sk_live_51ABC...XYZ123` (starts with sk_live_ for production)

**Description**:  
Clé API secrète Stripe pour traiter les paiements côté serveur. **EXTRÊMEMENT SENSIBLE** - accès complet à votre compte Stripe.

**Obtention**:
1. Créer un compte sur [Stripe Dashboard](https://dashboard.stripe.com/)
2. Aller dans "Developers" → "API keys"
3. Copier la "Secret key"
4. **Production**: Activer le compte et obtenir la clé `sk_live_`
5. **Test**: Utiliser la clé `sk_test_` pour le développement

**Sécurité CRITIQUE**:
- ⚠️ Donne accès à tous vos paiements et données clients
- ⚠️ Peut créer des remboursements
- ⚠️ Peut accéder aux données des cartes bancaires
- ✅ Ne JAMAIS l'exposer côté client
- ✅ Stocker uniquement en variable d'environnement
- ✅ Monitorer les accès dans le Stripe Dashboard

**Utilisée pour**:
- Créer des sessions de checkout
- Gérer les abonnements
- Traiter les webhooks
- Créer des Customer Portal

---

### `STRIPE_WEBHOOK_SECRET`
**Type**: String (secret)  
**Requis**: ✅ Oui (pour recevoir les événements Stripe)  
**Format**: `whsec_`  
**Exemple**: `whsec_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`

**Description**:  
Clé secrète pour vérifier l'authenticité des webhooks Stripe. Protège contre les requêtes malveillantes se faisant passer pour Stripe.

**Configuration**:
1. Stripe Dashboard → "Developers" → "Webhooks"
2. "Add endpoint"
3. Endpoint URL: `https://api.yourdomain.com/api/billing/webhook`
4. Sélectionner les événements :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copier le "Signing secret" (commence par `whsec_`)

**Événements traités**:
```typescript
// Webhooks configurés dans apps/api/src/billing/billing.controller.ts
- subscription.created → Nouveau abonnement activé
- subscription.updated → Changement de plan
- subscription.deleted → Annulation d'abonnement
- payment.succeeded → Paiement réussi
- payment.failed → Paiement échoué
```

**Sécurité**:
- Vérifie que les requêtes viennent vraiment de Stripe
- Protège contre les replay attacks
- Obligatoire en production

---

### `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
**Type**: String (public)  
**Requis**: ✅ Oui (pour le checkout côté client)  
**Format**: `pk_live_` (production) ou `pk_test_` (test)  
**Exemple**: `pk_live_51A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6`

**Description**:  
Clé API publique Stripe utilisée côté client pour initialiser Stripe.js. **Peut être exposée publiquement** (d'où le préfixe `NEXT_PUBLIC_`).

**Obtention**:
- Même page que STRIPE_SECRET_KEY
- "Publishable key" (visible côté client)

**Utilisation**:
```typescript
// apps/web/src/components/checkout.tsx
const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
```

**Sécurité**:
- ✅ Sûr à exposer côté client
- ✅ Ne permet PAS d'effectuer des paiements directement
- ✅ Utilisé uniquement pour créer des éléments UI Stripe

---

### `STRIPE_BASIC_PRICE_ID` / `STRIPE_PRO_PRICE_ID` / `STRIPE_ENTERPRISE_PRICE_ID`
**Type**: String  
**Requis**: ✅ Oui (pour créer les abonnements)  
**Format**: `price_`  
**Exemple**: `price_1A2B3C4D5E6F7G8H9I0J1K2L`

**Description**:  
Identifiants des prix Stripe pour chaque plan d'abonnement. Créés dans le Stripe Dashboard.

**Configuration**:
1. Stripe Dashboard → "Products"
2. Créer 3 produits :
   - **Whalli Basic** : $9.99/mois
     - 2 modèles AI (GPT-4o-mini, Claude Haiku)
     - 100 messages/jour
     - 1 Go de stockage
   - **Whalli Pro** : $29.99/mois
     - 7 modèles AI (+ GPT-4, Claude Sonnet, Grok)
     - 500 messages/jour
     - 10 Go de stockage
   - **Whalli Enterprise** : $99.99/mois
     - 10 modèles AI (tous les modèles)
     - Messages illimités
     - 100 Go de stockage

3. Pour chaque produit, créer un "Recurring price"
4. Copier le "Price ID" généré

**Utilisation dans le code**:
```typescript
// apps/api/src/billing/billing.service.ts
const priceIds = {
  BASIC: process.env.STRIPE_BASIC_PRICE_ID,
  PRO: process.env.STRIPE_PRO_PRICE_ID,
  ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID,
};
```

---

## 🤖 API d'Intelligence Artificielle

### `OPENAI_API_KEY`
**Type**: String (secret)  
**Requis**: ✅ Oui (pour utiliser les modèles OpenAI)  
**Format**: `sk-` suivi de caractères aléatoires  
**Exemple**: `sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc89`

**Description**:  
Clé API pour accéder aux modèles GPT d'OpenAI. Permet d'utiliser GPT-4, GPT-4o, GPT-4o-mini, et autres modèles.

**Obtention**:
1. Créer un compte sur [OpenAI Platform](https://platform.openai.com/)
2. Aller dans "API keys"
3. "Create new secret key"
4. **Important**: La clé n'est affichée qu'une seule fois
5. Ajouter des crédits de paiement dans "Billing"

**Modèles disponibles** (avec cette clé):
- `gpt-4o` - Modèle le plus avancé, multimodal
- `gpt-4o-mini` - Version optimisée, rapide et économique
- `gpt-4-turbo` - Version optimisée de GPT-4
- `gpt-3.5-turbo` - Modèle classique, économique

**Coûts** (approximatifs):
- GPT-4o : $5 / 1M tokens entrée, $15 / 1M tokens sortie
- GPT-4o-mini : $0.15 / 1M tokens entrée, $0.60 / 1M tokens sortie
- GPT-4-turbo : $10 / 1M tokens entrée, $30 / 1M tokens sortie

**Rate Limits**:
- Tier 1 (nouveau compte): 3,500 RPM (requests per minute)
- Augmente avec l'usage et les paiements

**Monitoring**:
- Dashboard OpenAI pour voir la consommation
- Métriques Prometheus dans `apps/api/src/common/metrics/`

---

### `ANTHROPIC_API_KEY`
**Type**: String (secret)  
**Requis**: ✅ Oui (pour utiliser les modèles Claude)  
**Format**: `sk-ant-` suivi de caractères aléatoires  
**Exemple**: `sk-ant-api03-abc123def456ghi789jkl012mno345pqr678stu901vwx234_ABC`

**Description**:  
Clé API pour accéder aux modèles Claude d'Anthropic. Claude excelle dans l'analyse de documents, le code, et les conversations longues.

**Obtention**:
1. Créer un compte sur [Anthropic Console](https://console.anthropic.com/)
2. "Get API keys"
3. "Create Key"
4. Ajouter un moyen de paiement

**Modèles disponibles**:
- `claude-3-opus-20240229` - Le plus puissant, pour tâches complexes
- `claude-3-5-sonnet-20240620` - Équilibre performance/coût
- `claude-3-haiku-20240307` - Rapide et économique
- `claude-2.1` - Modèle précédent, encore disponible

**Coûts** (approximatifs):
- Claude 3 Opus : $15 / 1M tokens entrée, $75 / 1M tokens sortie
- Claude 3.5 Sonnet : $3 / 1M tokens entrée, $15 / 1M tokens sortie
- Claude 3 Haiku : $0.25 / 1M tokens entrée, $1.25 / 1M tokens sortie

**Avantages Claude**:
- Contexte jusqu'à 200k tokens (vs 128k pour GPT-4)
- Excellent pour l'analyse de code
- Meilleur pour suivre des instructions complexes
- Plus "sûr" et refuse moins de requêtes

---

### `XAI_API_KEY`
**Type**: String (secret)  
**Requis**: ⚠️ Optionnel (pour Grok)  
**Format**: `xai-` suivi de caractères aléatoires  
**Exemple**: `xai-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`

**Description**:  
Clé API pour accéder aux modèles Grok de xAI (société d'Elon Musk). Grok a accès en temps réel à X (Twitter) et offre des réponses plus "directes".

**Obtention**:
1. S'inscrire sur [xAI Console](https://console.x.ai/)
2. Accès actuellement limité (liste d'attente possible)
3. "API Keys" → "Create new key"

**Modèles disponibles**:
- `grok-beta` - Version principale de Grok
- `grok-2` - Version améliorée (si disponible)

**Caractéristiques uniques**:
- Accès en temps réel aux données X (Twitter)
- Réponses plus "informelles" et directes
- Bon pour les questions d'actualité
- Moins "censuré" que d'autres modèles

**Utilisation dans Whalli**:
- Disponible uniquement pour les plans PRO et ENTERPRISE
- Utile pour les recherches d'actualité
- Analyse de tendances sur X

---

## 📧 Email SMTP

### `SMTP_HOST`
**Type**: String (hostname)  
**Requis**: ⚠️ Optionnel (si notifications email activées)  
**Exemple**: `smtp.gmail.com`, `smtp.sendgrid.net`, `smtp-relay.gmail.com`

**Description**:  
Adresse du serveur SMTP pour l'envoi d'emails. Utilisé pour les notifications (abonnement expiré, paiement échoué, task deadline, etc.).

**Options populaires**:

#### Gmail (gratuit, limité)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
```
- ⚠️ Limite : 500 emails/jour
- ⚠️ Nécessite App Password (2FA requis)
- ✅ Gratuit, facile à configurer

#### SendGrid (professionnel)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
```
- ✅ 100 emails/jour gratuit
- ✅ Scalable (plans payants)
- ✅ Statistiques et analytics

#### AWS SES (entreprise)
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=true
```
- ✅ Très économique ($0.10 / 1000 emails)
- ✅ Hautement scalable
- ⚠️ Configuration plus complexe

#### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
```

#### Postmark
```bash
SMTP_HOST=smtp.postmarkapp.com
SMTP_PORT=587
SMTP_SECURE=true
```

---

### `SMTP_PORT`
**Type**: Number  
**Requis**: ⚠️ Optionnel  
**Valeurs courantes**: `25`, `465`, `587`, `2525`

**Description**:  
Port du serveur SMTP. Le choix dépend du provider et du protocole.

**Ports standards**:
- **25** : Port SMTP standard (souvent bloqué par les ISP)
- **465** : SMTP avec SSL/TLS (connexion chiffrée dès le début)
- **587** : SMTP avec STARTTLS (commence non-chiffré puis upgrade)
- **2525** : Port alternatif (si 587 bloqué)

**Recommandations**:
- **Gmail** : 465 (SSL) ou 587 (STARTTLS)
- **SendGrid** : 587 (STARTTLS)
- **Production** : Préférer 587 ou 465 (chiffrement)

---

### `SMTP_SECURE`
**Type**: Boolean  
**Requis**: ⚠️ Optionnel  
**Valeurs**: `true` ou `false`

**Description**:  
Active ou désactive SSL/TLS pour la connexion SMTP.

**Correspondance Port/Secure**:
```bash
Port 465 → SMTP_SECURE=true   (SSL dès la connexion)
Port 587 → SMTP_SECURE=false  (STARTTLS ensuite)
Port 25  → SMTP_SECURE=false  (non recommandé en production)
```

**Sécurité**:
- ✅ Toujours utiliser SSL/TLS en production
- ✅ Protège les credentials et le contenu des emails
- ⚠️ `false` ne signifie pas "non sécurisé" si STARTTLS est utilisé

---

### `SMTP_USER`
**Type**: String (email ou username)  
**Requis**: ⚠️ Optionnel  
**Exemple**: `your-email@gmail.com` ou `apikey` (SendGrid)

**Description**:  
Nom d'utilisateur pour l'authentification SMTP.

**Selon le provider**:
- **Gmail** : Votre adresse email complète
- **SendGrid** : Littéralement `apikey`
- **AWS SES** : Username IAM SMTP
- **Mailgun** : `postmaster@yourdomain.com`

**Exemple Gmail avec App Password**:
```bash
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop  # App Password (16 chars)
```

---

### `SMTP_PASSWORD`
**Type**: String (secret)  
**Requis**: ⚠️ Optionnel  
**Exemple**: (varie selon provider)

**Description**:  
Mot de passe ou clé API pour l'authentification SMTP.

**Selon le provider**:

#### Gmail
- **PAS le mot de passe du compte Gmail**
- Nécessite App Password :
  1. Activer 2FA sur le compte Google
  2. Aller dans "Security" → "App passwords"
  3. Générer un mot de passe pour "Mail"
  4. Utiliser ce mot de passe (16 caractères, espaces ok)

#### SendGrid
- Utiliser la SendGrid API Key (commence par `SG.`)
- Créée dans SendGrid Dashboard → "API Keys"

#### AWS SES
- SMTP password généré par AWS
- Différent du IAM password

**Sécurité**:
- ⚠️ Stocker uniquement en variable d'environnement
- ⚠️ Ne JAMAIS commiter dans Git
- ✅ Révoquer immédiatement si compromise

---

### `SMTP_FROM_EMAIL`
**Type**: Email  
**Requis**: ⚠️ Optionnel  
**Exemple**: `noreply@yourdomain.com`

**Description**:  
Adresse email expéditeur pour tous les emails automatiques envoyés par l'application.

**Bonnes pratiques**:
- Utiliser `noreply@` pour les emails automatiques
- Ou `notifications@`, `support@`, `hello@`
- Doit être vérifiée chez votre provider SMTP
- Cohérente avec votre domaine

**Vérification domaine** (recommandé):
1. **SendGrid** : Verify domain via DNS records
2. **AWS SES** : Domain verification
3. **Mailgun** : Add and verify domain

---

### `SMTP_FROM_NAME`
**Type**: String  
**Requis**: ⚠️ Optionnel  
**Défaut**: `Whalli`  
**Exemple**: `Whalli` ou `Whalli Notifications`

**Description**:  
Nom affiché comme expéditeur dans les clients email.

**Affichage dans les emails**:
```
De: Whalli <noreply@yourdomain.com>
    ↑         ↑
  FROM_NAME  FROM_EMAIL
```

**Recommandations**:
- Court et reconnaissable
- Cohérent avec votre marque
- Éviter les ALL CAPS
- Éviter les caractères spéciaux

---

## 🚦 Rate Limiting

### `RATE_LIMIT_ENABLED`
**Type**: Boolean  
**Requis**: ✅ Oui  
**Valeurs**: `true` ou `false`  
**Recommandé**: `true` en production

**Description**:  
Active ou désactive le rate limiting global de l'API. Protège contre les abus, les attaques DDoS, et la surutilisation des ressources.

**Limites configurées** (dans `apps/api/src/common/guards/rate-limit.guard.ts`):
```typescript
// Par utilisateur authentifié
100 requêtes / minute

// Par IP (utilisateurs anonymes)
20 requêtes / minute
```

**Fonctionnement**:
1. Chaque requête est comptée dans Redis
2. TTL de 60 secondes par compteur
3. Headers HTTP ajoutés :
   ```
   X-RateLimit-Limit: 100
   X-RateLimit-Remaining: 87
   X-RateLimit-Reset: 1633024800
   ```
4. Si limite dépassée : HTTP 429 (Too Many Requests)

**Endpoints exemptés**:
- `/api/health` (monitoring)
- `/api/billing/webhook` (webhooks Stripe)
- Endpoints avec `@SkipRateLimit()` decorator

**Cas d'usage**:
- ✅ Production : `true` (protection obligatoire)
- ⚠️ Développement : `false` (facilite les tests)
- ✅ Staging : `true` (tester le comportement réel)

**Impact sur les coûts**:
- Réduit les coûts API AI (limite les abus)
- Protège contre les bots malveillants
- Préserve les ressources serveur

---

## 📊 Monitoring et Observabilité

### `TRAEFIK_AUTH`
**Type**: String (Basic Auth hash)  
**Requis**: ✅ Oui (pour sécuriser le dashboard Traefik)  
**Format**: `username:$$apr1$$hash`  
**Exemple**: `admin:$$apr1$$abc123def456$$xyz789`

**Description**:  
Credentials d'authentification pour accéder au dashboard Traefik. Protège l'interface d'administration du reverse proxy.

**Génération**:
```bash
# Méthode 1 : avec htpasswd (Apache utils)
htpasswd -nb admin your-strong-password

# Méthode 2 : avec Docker
docker run --rm httpd:alpine htpasswd -nb admin your-password

# IMPORTANT : Doubler les $ pour docker-compose
# Résultat : admin:$apr1$abc123$xyz789
# Pour .env : admin:$$apr1$$abc123$$xyz789
                   ↑↑      ↑↑
```

**Exemple complet**:
```bash
# 1. Générer le hash
$ htpasswd -nb admin MySecurePass123
admin:$apr1$k3.p5.6z$xyz789abc123def456

# 2. Doubler les $ pour .env
TRAEFIK_AUTH=admin:$$apr1$$k3.p5.6z$$xyz789abc123def456
```

**Accès au dashboard**:
- URL : `https://traefik.yourdomain.com`
- Login : `admin` (ou votre username)
- Password : Votre mot de passe (pas le hash)

**Contenu du dashboard**:
- Services actifs (web, api, admin, etc.)
- Routes et domaines configurés
- Certificats SSL Let's Encrypt
- Statistiques de trafic
- Health checks

---

### `PROMETHEUS_AUTH`
**Type**: String (Basic Auth hash)  
**Requis**: ✅ Oui (pour sécuriser Prometheus)  
**Format**: `username:$$apr1$$hash`  
**Exemple**: `admin:$$apr1$$def456ghi789$$abc123`

**Description**:  
Credentials d'authentification pour accéder à Prometheus. Protège l'accès aux métriques sensibles de votre infrastructure.

**Génération** (même méthode que TRAEFIK_AUTH):
```bash
htpasswd -nb admin your-prometheus-password
# Puis doubler les $$
```

**Accès à Prometheus**:
- URL : `https://prometheus.yourdomain.com`
- Login : `admin`
- Password : Votre mot de passe

**Métriques disponibles**:
- HTTP requests par endpoint
- Latence moyenne/p95/p99
- Taux d'erreur 4xx/5xx
- Utilisation AI par modèle
- Cache hit rate Redis
- Connexions base de données
- Mémoire/CPU des containers

**Queries utiles**:
```promql
# Requêtes par seconde
rate(http_requests_total[5m])

# Latence p95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Cache hit rate
rate(redis_cache_hits_total[5m]) / rate(redis_cache_requests_total[5m])
```

---

### `GRAFANA_ADMIN_USER`
**Type**: String  
**Requis**: ✅ Oui  
**Défaut**: `admin`  
**Exemple**: `admin`

**Description**:  
Nom d'utilisateur administrateur pour Grafana. Simple et direct.

**Utilisation**:
- Connexion initiale à Grafana
- Accès complet à tous les dashboards
- Gestion des utilisateurs et permissions

**Recommandation**:
- Garder `admin` est acceptable
- Ou utiliser un nom personnalisé si préféré

---

### `GRAFANA_ADMIN_PASSWORD`
**Type**: String (32+ caractères)  
**Requis**: ✅ Oui  
**Génération**: `openssl rand -base64 32`  
**Exemple**: `P9mR3nK6tY2wQ5xZ8vB1nM4jH7gF0dS3`

**Description**:  
Mot de passe administrateur pour Grafana. Protège l'accès aux dashboards de monitoring et aux données sensibles.

**Accès à Grafana**:
- URL : `https://grafana.yourdomain.com`
- Login : `admin` (ou GRAFANA_ADMIN_USER)
- Password : Valeur de cette variable

**Dashboards pré-configurés**:
1. **API Overview**
   - Requests/sec par endpoint
   - Erreurs 4xx/5xx
   - Latence p50/p95/p99
   - Top endpoints les plus lents

2. **AI Models Usage**
   - Requêtes par modèle (GPT-4, Claude, etc.)
   - Coûts estimés par modèle
   - Tokens consommés
   - Cache hit rate

3. **Infrastructure**
   - CPU/RAM par container
   - Disk usage
   - Network traffic
   - Database connections

4. **Business Metrics**
   - Nouveaux utilisateurs
   - Abonnements actifs
   - Messages envoyés
   - Revenue estimé

**Sécurité**:
- ✅ Mot de passe fort requis
- ✅ Différent des autres passwords
- ⚠️ Accès aux métriques = accès à des infos sensibles
- ✅ Possibilité d'ajouter d'autres utilisateurs avec permissions limitées

---

## 🔧 Configuration Avancée

### Variables Non Exposées (Générées Automatiquement)

#### `MINIO_ENDPOINT`
**Valeur**: `http://minio:9000`  
**Description**: URL interne du service MinIO (communication entre containers Docker)

#### `MINIO_PUBLIC_ENDPOINT`
**Valeur**: `https://storage.yourdomain.com`  
**Description**: URL publique pour accéder aux fichiers uploadés

#### `PORT`
**Valeur**: `3001`  
**Description**: Port sur lequel l'API NestJS écoute en interne

#### `NODE_ENV`
**Valeur**: `production`  
**Description**: Environnement d'exécution Node.js

---

## 📋 Checklist de Configuration Production

### Étape 1 : Domaine et DNS ✅
- [ ] Acheter un nom de domaine
- [ ] Configurer les DNS A records :
  - [ ] `@` → IP serveur
  - [ ] `*` → IP serveur (wildcard)
- [ ] Attendre propagation DNS (1-48h)

### Étape 2 : Base de Données ✅
- [ ] Créer compte Neon.tech
- [ ] Créer projet PostgreSQL
- [ ] Copier `DATABASE_URL`
- [ ] Tester connexion : `psql $DATABASE_URL`

### Étape 3 : Génération des Secrets ✅
```bash
# Redis
openssl rand -base64 32  # REDIS_PASSWORD

# Auth
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # BETTER_AUTH_SECRET

# MinIO
openssl rand -base64 32  # MINIO_ROOT_PASSWORD

# Grafana
openssl rand -base64 32  # GRAFANA_ADMIN_PASSWORD

# Basic Auth
htpasswd -nb admin password  # TRAEFIK_AUTH (puis doubler $$)
htpasswd -nb admin password  # PROMETHEUS_AUTH (puis doubler $$)
```

### Étape 4 : Services Tiers ✅
- [ ] **Stripe** :
  - [ ] Créer compte et activer mode live
  - [ ] Copier `STRIPE_SECRET_KEY`
  - [ ] Créer webhook endpoint
  - [ ] Copier `STRIPE_WEBHOOK_SECRET`
  - [ ] Créer 3 produits (Basic, Pro, Enterprise)
  - [ ] Copier les 3 `PRICE_ID`

- [ ] **OpenAI** :
  - [ ] Créer compte
  - [ ] Ajouter moyen de paiement
  - [ ] Générer `OPENAI_API_KEY`

- [ ] **Anthropic** :
  - [ ] Créer compte
  - [ ] Ajouter moyen de paiement
  - [ ] Générer `ANTHROPIC_API_KEY`

- [ ] **xAI** (optionnel) :
  - [ ] S'inscrire (liste d'attente possible)
  - [ ] Générer `XAI_API_KEY`

- [ ] **GitHub OAuth** (optionnel) :
  - [ ] Créer OAuth App
  - [ ] Configurer callback URLs
  - [ ] Copier `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET`

- [ ] **Google OAuth** (optionnel) :
  - [ ] Créer projet Google Cloud
  - [ ] Configurer OAuth consent screen
  - [ ] Créer credentials
  - [ ] Copier `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`

- [ ] **SMTP** (optionnel) :
  - [ ] Choisir provider (Gmail, SendGrid, etc.)
  - [ ] Configurer compte
  - [ ] Obtenir credentials
  - [ ] Tester envoi d'email

### Étape 5 : Copier .env.production.example ✅
```bash
cp .env.production.example .env
nano .env  # Remplir toutes les valeurs
```

### Étape 6 : Déployer ✅
```bash
# Via script automatique
./deploy-prod.sh deploy

# Ou manuellement
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec api pnpm prisma migrate deploy
```

### Étape 7 : Vérification ✅
- [ ] `curl https://api.yourdomain.com/api/health` → `{"status":"ok"}`
- [ ] `https://app.yourdomain.com` → Page d'accueil
- [ ] `https://admin.yourdomain.com` → Panel admin
- [ ] `https://grafana.yourdomain.com` → Dashboards
- [ ] `https://traefik.yourdomain.com` → Dashboard Traefik
- [ ] Test création compte utilisateur
- [ ] Test envoi message chat
- [ ] Test upload fichier
- [ ] Test payment Stripe (mode test)

---

## 🔒 Sécurité : Best Practices

### Règles d'Or

1. **Ne JAMAIS commiter les secrets dans Git**
   ```bash
   # Toujours dans .gitignore
   .env
   .env.production
   .env.local
   ```

2. **Utiliser des secrets uniques par environnement**
   ```bash
   # ❌ Mauvais
   Dev JWT_SECRET = Production JWT_SECRET
   
   # ✅ Bon
   Dev JWT_SECRET ≠ Production JWT_SECRET
   ```

3. **Rotation régulière des secrets**
   - Tous les 90 jours minimum
   - Immédiatement si compromis
   - Après départ d'un membre de l'équipe

4. **Principe du moindre privilège**
   - Une API key par service si possible
   - Permissions minimales requises
   - Pas de clés admin pour les services

5. **Monitoring des accès**
   - Logs d'authentification
   - Alertes sur échecs répétés
   - Dashboard Grafana pour anomalies

6. **Backup des secrets**
   - Manager de mots de passe (1Password, LastPass, Bitwarden)
   - Encrypted vault
   - Accès limité à 2-3 personnes

7. **Variables publiques vs privées**
   ```bash
   # ✅ Peut être exposé côté client
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
   
   # ❌ NE JAMAIS exposer côté client
   STRIPE_SECRET_KEY=sk_live_xxx
   JWT_SECRET=xxx
   DATABASE_URL=xxx
   ```

---

## 📞 Support et Ressources

### Documentation Officielle
- **Neon**: https://neon.tech/docs
- **Stripe**: https://stripe.com/docs
- **OpenAI**: https://platform.openai.com/docs
- **Anthropic**: https://docs.anthropic.com/
- **Redis**: https://redis.io/documentation
- **MinIO**: https://min.io/docs/minio/linux/
- **Traefik**: https://doc.traefik.io/traefik/
- **Grafana**: https://grafana.com/docs/

### Whalli Documentation
- **Production Deployment**: `PRODUCTION_DEPLOYMENT.md`
- **GitHub Actions**: `GITHUB_ACTIONS_DEPLOYMENT.md`
- **Database Config**: `apps/api/DATABASE_CONFIG.md`
- **Monitoring**: `apps/api/MONITORING_OBSERVABILITY.md`

### Outils Utiles
```bash
# Tester SMTP
npm install -g maildev
maildev

# Tester webhooks localement
npm install -g stripe-cli
stripe listen --forward-to localhost:3001/api/billing/webhook

# Monitorer Redis
redis-cli monitor

# Logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 📊 Tableau Récapitulatif

| Variable | Requis | Type | Génération | Coût |
|----------|--------|------|------------|------|
| `DOMAIN` | ✅ | Public | Manuel | ~$10/an |
| `DATABASE_URL` | ✅ | Secret | Neon Console | $0-20/mois |
| `REDIS_URL` | ✅ | Secret | Auto-généré | Inclus |
| `REDIS_PASSWORD` | ✅ | Secret | `openssl rand -base64 32` | - |
| `MINIO_ROOT_PASSWORD` | ✅ | Secret | `openssl rand -base64 32` | Inclus |
| `JWT_SECRET` | ✅ | Secret | `openssl rand -base64 32` | - |
| `BETTER_AUTH_SECRET` | ✅ | Secret | `openssl rand -base64 32` | - |
| `STRIPE_SECRET_KEY` | ✅ | Secret | Stripe Dashboard | 2.9%+$0.30/transaction |
| `OPENAI_API_KEY` | ✅ | Secret | OpenAI Platform | $0.15-15/1M tokens |
| `ANTHROPIC_API_KEY` | ✅ | Secret | Anthropic Console | $0.25-75/1M tokens |
| `XAI_API_KEY` | ⚠️ | Secret | xAI Console | Variable |
| `GITHUB_CLIENT_ID` | ⚠️ | Public | GitHub Settings | Gratuit |
| `GOOGLE_CLIENT_ID` | ⚠️ | Public | Google Cloud | Gratuit |
| `SMTP_*` | ⚠️ | Mixed | Provider | $0-100/mois |
| `GRAFANA_ADMIN_PASSWORD` | ✅ | Secret | `openssl rand -base64 32` | Inclus |
| `TRAEFIK_AUTH` | ✅ | Secret | `htpasswd -nb` | Inclus |

**Légende**:
- ✅ Requis pour démarrer l'application
- ⚠️ Optionnel (fonctionnalité peut être désactivée)

**Coût total estimé** (production):
- **Minimum** : ~$30/mois (Neon + Domaine + Serveur basique)
- **Recommandé** : ~$100/mois (+ SMTP professionnel + AI usage modéré)
- **Enterprise** : $200+/mois (AI usage intensif, scaling)

---

**Version**: 1.0.0  
**Dernière mise à jour**: 5 octobre 2025  
**Maintenu par**: Équipe Whalli  
**Licence**: Propriétaire
