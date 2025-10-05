# 🎨 GitHub Secrets - Guide Visuel

Architecture visuelle et flux de configuration des secrets GitHub pour Whalli.

---

## 📊 Vue d'Ensemble des 21 Secrets

```
┌─────────────────────────────────────────────────────────────────┐
│                  GITHUB SECRETS (21 total)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Server    │  │   Database   │  │    Redis     │          │
│  │   (3) ⏳    │  │    (1) ✅    │  │    (2) ✅    │          │
│  └─────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Auth     │  │    Stripe    │  │      AI      │          │
│  │   (2) ✅    │  │    (3) ✅    │  │    (3) ✅    │          │
│  └─────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    MinIO    │  │  Monitoring  │  │    Domain    │          │
│  │   (4) ✅    │  │    (1) ✅    │  │    (2) ✅    │          │
│  └─────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Statut : 18/21 configurés ✅  |  3/21 manquants ⏳
```

---

## 🔄 Flux de Configuration

```
┌──────────────────────────────────────────────────────────────────┐
│                     FLUX DE CONFIGURATION                         │
└──────────────────────────────────────────────────────────────────┘

1️⃣  SOURCE DES DONNÉES
    │
    ├─→ .env.production.example
    │   └─→ Contient 18 secrets pré-configurés
    │
    └─→ Configuration Manuelle
        └─→ 3 secrets serveur (USER/HOST/SSH_KEY)


2️⃣  SCRIPTS DE CONFIGURATION
    │
    ├─→ auto-setup-secrets.sh
    │   ├─→ Lit .env.production.example
    │   ├─→ Génère MINIO_ACCESS_KEY (hex 40 chars)
    │   ├─→ Génère MINIO_SECRET_KEY (base64 32 chars)
    │   └─→ Crée 18 secrets via GitHub CLI
    │
    └─→ add-server-secrets.sh
        ├─→ Demande SERVER_HOST (IP)
        ├─→ Demande SERVER_USER (username)
        ├─→ Génère ou utilise SSH key
        └─→ Crée 3 secrets serveur via GitHub CLI


3️⃣  GITHUB ACTIONS
    │
    └─→ Repository: Whalli/whalli
        └─→ Settings → Secrets → Actions
            └─→ 21 secrets disponibles pour workflows


4️⃣  WORKFLOWS
    │
    ├─→ ci-cd.yml
    │   └─→ Build & Push Docker images → ghcr.io/whalli/*
    │
    └─→ deploy.yml
        ├─→ SSH vers SERVER_HOST avec SSH_PRIVATE_KEY
        ├─→ Crée .env avec tous les secrets
        ├─→ Build & Deploy Docker Compose
        └─→ Run Prisma migrations


5️⃣  PRODUCTION
    │
    └─→ Serveur de Production
        ├─→ Web (app.whalli.com)
        ├─→ API (api.whalli.com)
        ├─→ Admin (admin.whalli.com)
        ├─→ Neon Postgres (DATABASE_URL)
        ├─→ Redis Cache (REDIS_URL)
        ├─→ MinIO Storage (MINIO_*)
        └─→ Grafana Monitoring (GRAFANA_ADMIN_PASSWORD)
```

---

## 🏗️ Architecture des Secrets par Catégorie

### 1. Server Access (3 secrets) ⏳

```
┌────────────────────────────────────────┐
│         SERVER ACCESS                  │
├────────────────────────────────────────┤
│                                        │
│  SSH_PRIVATE_KEY                       │
│  ┌──────────────────────────────────┐  │
│  │ -----BEGIN OPENSSH PRIVATE KEY-│  │
│  │ base64encoded...               │  │
│  │ -----END OPENSSH PRIVATE KEY---│  │
│  └──────────────────────────────────┘  │
│         │                              │
│         ├──→ Authentification SSH      │
│         └──→ Déploiement automatique   │
│                                        │
│  SERVER_HOST                           │
│  ┌──────────────────────────────────┐  │
│  │ 123.45.67.89                    │  │
│  │ ou server.whalli.com            │  │
│  └──────────────────────────────────┘  │
│         │                              │
│         └──→ Cible du déploiement      │
│                                        │
│  SERVER_USER                           │
│  ┌──────────────────────────────────┐  │
│  │ ubuntu / root / deploy          │  │
│  └──────────────────────────────────┘  │
│         │                              │
│         └──→ Username SSH              │
│                                        │
└────────────────────────────────────────┘
```

### 2. Database (1 secret) ✅

```
┌────────────────────────────────────────┐
│         NEON POSTGRES                  │
├────────────────────────────────────────┤
│                                        │
│  DATABASE_URL                          │
│  ┌──────────────────────────────────┐  │
│  │ postgresql://user:pass@          │  │
│  │ ep-xxx.aws.neon.tech/db          │  │
│  │ ?sslmode=require                 │  │
│  └──────────────────────────────────┘  │
│         │                              │
│         ├──→ Prisma ORM                │
│         ├──→ API Database Access       │
│         └──→ Migrations                │
│                                        │
└────────────────────────────────────────┘
```

### 3. Redis Cache (2 secrets) ✅

```
┌────────────────────────────────────────┐
│           REDIS CACHE                  │
├────────────────────────────────────────┤
│                                        │
│  REDIS_PASSWORD                        │
│  ┌──────────────────────────────────┐  │
│  │ 4lbxNH...x5/fQWj8cIE...          │  │
│  └──────────────────────────────────┘  │
│         │                              │
│         └──→ Authentification Redis    │
│                                        │
│  REDIS_URL                             │
│  ┌──────────────────────────────────┐  │
│  │ redis://:PASSWORD@redis:6379/0  │  │
│  └──────────────────────────────────┘  │
│         │                              │
│         ├──→ Chat Cache (99% savings) │
│         ├──→ BullMQ Jobs               │
│         └──→ Rate Limiting             │
│                                        │
└────────────────────────────────────────┘
```

### 4. MinIO Storage (4 secrets) ✅

```
┌────────────────────────────────────────┐
│       MINIO (S3-compatible)            │
├────────────────────────────────────────┤
│                                        │
│  Admin Access                          │
│  ┌──────────────────────────────────┐  │
│  │ MINIO_ROOT_USER                 │  │
│  │ MINIO_ROOT_PASSWORD             │  │
│  └──────────────────────────────────┘  │
│         │                              │
│         └──→ Console Admin UI          │
│                                        │
│  API Access (Application)              │
│  ┌──────────────────────────────────┐  │
│  │ MINIO_ACCESS_KEY (40 chars hex) │  │
│  │ MINIO_SECRET_KEY (32 chars b64) │  │
│  └──────────────────────────────────┘  │
│         │                              │
│         ├──→ File Uploads              │
│         ├──→ Image Storage             │
│         ├──→ Document Storage          │
│         └──→ Voice Recordings          │
│                                        │
└────────────────────────────────────────┘
```

### 5. AI Providers (3 secrets) ✅

```
┌────────────────────────────────────────┐
│          AI PROVIDERS                  │
├────────────────────────────────────────┤
│                                        │
│  ┌─────────────────────────────────┐   │
│  │ OPENAI_API_KEY                  │   │
│  │ sk-proj-...                     │   │
│  └─────────────────────────────────┘   │
│         │                              │
│         ├──→ GPT-4 Turbo               │
│         ├──→ GPT-4                     │
│         ├──→ GPT-3.5 Turbo             │
│         └──→ Whisper (transcription)   │
│                                        │
│  ┌─────────────────────────────────┐   │
│  │ ANTHROPIC_API_KEY               │   │
│  │ sk-ant-api03-...                │   │
│  └─────────────────────────────────┘   │
│         │                              │
│         ├──→ Claude 3.5 Sonnet         │
│         ├──→ Claude 3 Opus             │
│         ├──→ Claude 3 Sonnet           │
│         └──→ Claude 3 Haiku            │
│                                        │
│  ┌─────────────────────────────────┐   │
│  │ XAI_API_KEY                     │   │
│  │ xai-...                         │   │
│  └─────────────────────────────────┘   │
│         │                              │
│         ├──→ Grok 2 (Latest)           │
│         └──→ Grok 2 Mini               │
│                                        │
└────────────────────────────────────────┘

Total: 10 AI Models
```

### 6. Stripe Billing (3 secrets) ✅

```
┌────────────────────────────────────────┐
│         STRIPE PAYMENTS                │
├────────────────────────────────────────┤
│                                        │
│  STRIPE_SECRET_KEY                     │
│  ┌──────────────────────────────────┐  │
│  │ sk_live_51...                   │  │
│  └──────────────────────────────────┘  │
│         │                              │
│         ├──→ Backend API               │
│         ├──→ Create Subscriptions      │
│         └──→ Process Payments          │
│                                        │
│  STRIPE_WEBHOOK_SECRET                 │
│  ┌──────────────────────────────────┐  │
│  │ whsec_...                       │  │
│  └──────────────────────────────────┘  │
│         │                              │
│         ├──→ Webhook Signature Verify  │
│         └──→ Event Processing          │
│                                        │
│  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY    │
│  ┌──────────────────────────────────┐  │
│  │ pk_live_51...                   │  │
│  └──────────────────────────────────┘  │
│         │                              │
│         ├──→ Frontend Checkout         │
│         └──→ Public Payment Forms      │
│                                        │
└────────────────────────────────────────┘

Plans: BASIC ($9.99), PRO ($29.99), ENTERPRISE ($99.99)
```

---

## 🔐 Flux de Sécurité

```
┌──────────────────────────────────────────────────────────────────┐
│                      SECURITY FLOW                                │
└──────────────────────────────────────────────────────────────────┘


1️⃣  DÉVELOPPEUR
    │
    ├─→ Configure secrets localement (.env.production.example)
    │
    └─→ Execute script: ./scripts/auto-setup-secrets.sh


2️⃣  GITHUB CLI
    │
    ├─→ Authentification: gh auth login
    │
    └─→ Upload secrets (chiffrés)
        └─→ API: https://api.github.com/repos/Whalli/whalli/actions/secrets


3️⃣  GITHUB (Encrypted Storage)
    │
    ├─→ Secrets chiffrés avec libsodium sealed boxes
    ├─→ Déchiffrement uniquement dans GitHub Actions runners
    └─→ Jamais exposés dans logs ou UI


4️⃣  GITHUB ACTIONS RUNNER
    │
    ├─→ Workflow déclenché (push, workflow_dispatch)
    │
    ├─→ Secrets injectés comme variables d'environnement
    │   └─→ ${{ secrets.DATABASE_URL }}
    │
    └─→ SSH vers serveur production
        └─→ Crée .env sur serveur avec tous les secrets


5️⃣  SERVEUR DE PRODUCTION
    │
    ├─→ .env créé avec toutes les variables
    │
    ├─→ Docker Compose lit .env
    │
    └─→ Services lancés avec configuration
        ├─→ Web → STRIPE_PUBLISHABLE_KEY
        ├─→ API → Tous les secrets
        ├─→ Redis → REDIS_PASSWORD
        ├─→ MinIO → MINIO_ROOT_USER/PASSWORD
        └─→ Grafana → GRAFANA_ADMIN_PASSWORD


6️⃣  SERVICES EXTERNES
    │
    ├─→ Neon Postgres (DATABASE_URL)
    ├─→ OpenAI API (OPENAI_API_KEY)
    ├─→ Anthropic API (ANTHROPIC_API_KEY)
    ├─→ xAI API (XAI_API_KEY)
    ├─→ Stripe API (STRIPE_SECRET_KEY)
    └─→ Let's Encrypt (ACME_EMAIL)
```

---

## 📈 Diagramme de Déploiement

```
┌───────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE                         │
└───────────────────────────────────────────────────────────────────┘


                       GITHUB REPOSITORY
                       (Whalli/whalli)
                              │
                              │ git push
                              ▼
                    ┌─────────────────────┐
                    │  GitHub Actions     │
                    │  (CI/CD Workflow)   │
                    └─────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
       ┌─────────────────┐        ┌─────────────────┐
       │   Build Images  │        │  Deploy to Prod │
       │   (ci-cd.yml)   │        │  (deploy.yml)   │
       └─────────────────┘        └─────────────────┘
                │                           │
                │ push                      │ SSH
                ▼                           ▼
       ┌─────────────────┐        ┌─────────────────┐
       │ GitHub Registry │        │  Prod Server    │
       │ ghcr.io/whalli/ │        │ (SERVER_HOST)   │
       │  ├─ web         │        └─────────────────┘
       │  ├─ api         │                 │
       │  └─ admin       │                 │
       └─────────────────┘                 │
                                           ▼
                              ┌────────────────────────┐
                              │  Docker Compose        │
                              │  ├─ Web (3000)         │
                              │  ├─ API (3001)         │
                              │  ├─ Admin (3002)       │
                              │  ├─ Redis (6379)       │
                              │  ├─ MinIO (9000/9001)  │
                              │  ├─ Prometheus (9090)  │
                              │  └─ Grafana (3003)     │
                              └────────────────────────┘
                                           │
                              ┌────────────┴────────────┐
                              │                         │
                              ▼                         ▼
                    ┌──────────────────┐      ┌──────────────────┐
                    │  External Svcs   │      │   Traefik Proxy  │
                    │  ├─ Neon DB      │      │  ├─ SSL/TLS      │
                    │  ├─ OpenAI       │      │  ├─ Routing      │
                    │  ├─ Anthropic    │      │  └─ ACME/LE      │
                    │  ├─ xAI          │      └──────────────────┘
                    │  └─ Stripe       │                │
                    └──────────────────┘                │
                                                        ▼
                                              ┌──────────────────┐
                                              │  Public Internet │
                                              │  ├─ whalli.com   │
                                              │  ├─ app.*        │
                                              │  ├─ api.*        │
                                              │  └─ admin.*      │
                                              └──────────────────┘
```

---

## 🎯 Matrice de Permissions

```
┌────────────────────────────────────────────────────────────────┐
│                   SECRET PERMISSIONS MATRIX                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Secret                      │ ci-cd.yml │ deploy.yml │ Prod  │
│  ───────────────────────────┼───────────┼────────────┼───────│
│  SSH_PRIVATE_KEY             │     -     │     ✅     │   -   │
│  SERVER_HOST                 │     -     │     ✅     │   -   │
│  SERVER_USER                 │     -     │     ✅     │   -   │
│  DATABASE_URL                │     -     │     ✅     │  ✅   │
│  REDIS_URL                   │     -     │     ✅     │  ✅   │
│  REDIS_PASSWORD              │     -     │     ✅     │  ✅   │
│  JWT_SECRET                  │     -     │     ✅     │  ✅   │
│  BETTER_AUTH_SECRET          │     -     │     ✅     │  ✅   │
│  STRIPE_*                    │     -     │     ✅     │  ✅   │
│  OPENAI_API_KEY              │     -     │     ✅     │  ✅   │
│  ANTHROPIC_API_KEY           │     -     │     ✅     │  ✅   │
│  XAI_API_KEY                 │     -     │     ✅     │  ✅   │
│  MINIO_*                     │     -     │     ✅     │  ✅   │
│  GRAFANA_ADMIN_PASSWORD      │     -     │     ✅     │  ✅   │
│  DOMAIN                      │     -     │     ✅     │  ✅   │
│  ACME_EMAIL                  │     -     │     ✅     │  ✅   │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Note: ci-cd.yml utilise uniquement GITHUB_TOKEN (automatique)
```

---

## 🚦 État de Configuration Visuel

```
┌────────────────────────────────────────────────────────────────┐
│                  CONFIGURATION STATUS                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Catégorie          │ Count │ Status │ Progress               │
│  ──────────────────┼───────┼────────┼───────────────────────│
│  Server Access      │  3    │   ⏳   │ ░░░░░░░░░░░░░░░░░ 0%  │
│  Database           │  1    │   ✅   │ ████████████████ 100% │
│  Redis              │  2    │   ✅   │ ████████████████ 100% │
│  Auth               │  2    │   ✅   │ ████████████████ 100% │
│  Stripe             │  3    │   ✅   │ ████████████████ 100% │
│  AI Providers       │  3    │   ✅   │ ████████████████ 100% │
│  MinIO              │  4    │   ✅   │ ████████████████ 100% │
│  Monitoring         │  1    │   ✅   │ ████████████████ 100% │
│  Domain             │  2    │   ✅   │ ████████████████ 100% │
│  ──────────────────┼───────┼────────┼───────────────────────│
│  TOTAL              │ 21    │  86%   │ █████████████░░░ 86%  │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Legend: ✅ Configuré  |  ⏳ En attente  |  ❌ Manquant
```

---

## 🔄 Timeline de Configuration

```
┌────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION TIMELINE                       │
└────────────────────────────────────────────────────────────────┘

[2025-10-05 14:30] 📝 Création de .env.production.example
                    └─→ 21 variables définies

[2025-10-05 14:45] 🔧 Création de auto-setup-secrets.sh
                    └─→ Script automatique pour 18 secrets

[2025-10-05 15:00] ✅ Exécution de auto-setup-secrets.sh
                    ├─→ DATABASE_URL ✅
                    ├─→ REDIS_PASSWORD, REDIS_URL ✅
                    ├─→ JWT_SECRET, BETTER_AUTH_SECRET ✅
                    ├─→ STRIPE_* (3) ✅
                    ├─→ AI_* (3) ✅
                    ├─→ MINIO_* (4) ✅
                    ├─→ GRAFANA_ADMIN_PASSWORD ✅
                    └─→ DOMAIN, ACME_EMAIL ✅

[2025-10-05 15:05] 📊 Status: 18/21 secrets configurés (86%)

[2025-10-05 15:10] ⏳ En attente:
                    ├─→ SSH_PRIVATE_KEY
                    ├─→ SERVER_HOST
                    └─→ SERVER_USER

[2025-10-05 15:15] 🚀 Action requise:
                    └─→ ./scripts/add-server-secrets.sh
```

---

## 🎓 Guide de Dépannage Visuel

```
┌────────────────────────────────────────────────────────────────┐
│                   TROUBLESHOOTING GUIDE                         │
└────────────────────────────────────────────────────────────────┘

❌ Problème: "gh: command not found"
   │
   ├─→ Solution: Installer GitHub CLI
   │
   └─→ Commands:
       $ curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
       $ echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list
       $ sudo apt update && sudo apt install gh

────────────────────────────────────────────────────────────────

❌ Problème: "not authenticated with GitHub CLI"
   │
   ├─→ Solution: Se connecter avec GitHub CLI
   │
   └─→ Command:
       $ gh auth login
       # Suivre les instructions interactives

────────────────────────────────────────────────────────────────

❌ Problème: "permission denied (publickey)"
   │
   ├─→ Cause: Clé SSH non ajoutée au serveur
   │
   └─→ Solution:
       $ ssh-copy-id -i ~/.ssh/github_deploy_key.pub user@server
       $ ssh -i ~/.ssh/github_deploy_key user@server  # Test

────────────────────────────────────────────────────────────────

❌ Problème: Secret invalide dans workflow
   │
   ├─→ Diagnostic:
   │   └─→ Vérifier les logs GitHub Actions
   │
   └─→ Solution:
       $ echo "correct_value" | gh secret set SECRET_NAME --repo Whalli/whalli
```

---

## 📚 Légende

```
Symboles:
  ✅  Configuré et fonctionnel
  ⏳  En attente de configuration
  ❌  Manquant ou invalide
  🔐  Secret sensible (chiffré)
  🔓  Information publique
  📝  Configuration manuelle requise
  🤖  Configuration automatique
  ⚡  Action rapide
  🚀  Prêt au déploiement
  📊  Statistiques
  🔍  Vérification
  ⚠️  Attention requise
  💡  Conseil
  🎯  Objectif
  🔄  Processus
  📈  Progression
  🛠️  Outil
  📚  Documentation
```

---

**Date de création**: 5 octobre 2025  
**Dernière mise à jour**: 5 octobre 2025  
**Statut**: 18/21 secrets configurés (86%)  
**Version**: 1.0.0
