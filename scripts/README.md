# GitHub Secrets Setup Scripts

Ce dossier contient plusieurs scripts pour configurer automatiquement les secrets GitHub Actions nécessaires au déploiement de Whalli.

## 📋 Scripts Disponibles

### 1. `auto-setup-secrets.sh` ⚡ (Recommandé)
**Script automatique rapide** - Crée 18/21 secrets automatiquement depuis `.env.production.example`

```bash
./scripts/auto-setup-secrets.sh
```

**Avantages**:
- ✅ Aucune interaction requise
- ✅ Utilise les valeurs de `.env.production.example`
- ✅ Très rapide (~5 secondes)
- ✅ Génère automatiquement MINIO_ACCESS_KEY et MINIO_SECRET_KEY

**Secrets créés** (18):
- DATABASE_URL, REDIS_PASSWORD, REDIS_URL
- JWT_SECRET, BETTER_AUTH_SECRET
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- OPENAI_API_KEY, ANTHROPIC_API_KEY, XAI_API_KEY
- MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, MINIO_ACCESS_KEY, MINIO_SECRET_KEY
- GRAFANA_ADMIN_PASSWORD
- DOMAIN, ACME_EMAIL

**Secrets manquants** (3):
- SSH_PRIVATE_KEY, SERVER_HOST, SERVER_USER

---

### 2. `add-server-secrets.sh` 🔐
**Script interactif** - Ajoute les 3 secrets serveur manquants

```bash
./scripts/add-server-secrets.sh
```

**Fonctionnalités**:
- ✅ Guide interactif étape par étape
- ✅ Génération automatique de clé SSH (option 1)
- ✅ Support de clé SSH existante (option 2)
- ✅ Affichage de la clé publique à ajouter au serveur
- ✅ Instructions `ssh-copy-id` automatiques

**Secrets ajoutés**:
1. **SERVER_HOST**: IP ou hostname du serveur de production
2. **SERVER_USER**: Nom d'utilisateur SSH (ubuntu, root, deploy, etc.)
3. **SSH_PRIVATE_KEY**: Clé privée SSH pour le déploiement

---

### 3. `setup-github-secrets.sh` 📝 (Complet)
**Script interactif complet** - Configuration manuelle de tous les secrets

```bash
./scripts/setup-github-secrets.sh
```

**Avantages**:
- ✅ Configuration 100% personnalisée
- ✅ Génère automatiquement les secrets aléatoires
- ✅ Sauvegarde les secrets générés dans `/tmp/`
- ✅ Guide détaillé pour chaque secret

**Utilisation**:
- Pour une première configuration complète
- Pour régénérer tous les secrets
- Pour personnaliser chaque valeur

---

### 4. `quick-setup-secrets.sh` ⚡📝 (Hybride)
**Script hybride** - Automatique + interactif pour certains secrets

```bash
./scripts/quick-setup-secrets.sh
```

**Fonctionnement**:
- Lit automatiquement `.env.production.example`
- Demande uniquement les secrets serveur (SSH, HOST, USER)
- Génère automatiquement MINIO_ACCESS_KEY et MINIO_SECRET_KEY

---

## 🚀 Configuration Recommandée (2 étapes)

### Étape 1: Secrets automatiques (18/21)
```bash
./scripts/auto-setup-secrets.sh
```
⏱️ Durée: ~5 secondes

### Étape 2: Secrets serveur (3/21)
```bash
./scripts/add-server-secrets.sh
```
⏱️ Durée: ~2 minutes

**Total: 21/21 secrets configurés** ✅

---

## 📊 Liste des 21 Secrets

### Server Access (3)
1. `SSH_PRIVATE_KEY` - Clé privée SSH (multi-lignes)
2. `SERVER_HOST` - IP serveur (ex: `123.45.67.89`)
3. `SERVER_USER` - Username SSH (ex: `ubuntu`)

### Database (1)
4. `DATABASE_URL` - Neon Postgres connection string

### Application (4)
5. `REDIS_PASSWORD` - Redis password
6. `REDIS_URL` - Redis connection URL
7. `JWT_SECRET` - JWT signing secret
8. `BETTER_AUTH_SECRET` - Better Auth secret

### Stripe (3)
9. `STRIPE_SECRET_KEY` - Stripe API secret key
10. `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
11. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### AI Providers (3)
12. `OPENAI_API_KEY` - OpenAI API key
13. `ANTHROPIC_API_KEY` - Anthropic/Claude API key
14. `XAI_API_KEY` - xAI/Grok API key

### MinIO (4)
15. `MINIO_ROOT_USER` - MinIO admin username
16. `MINIO_ROOT_PASSWORD` - MinIO admin password
17. `MINIO_ACCESS_KEY` - MinIO S3 access key (API)
18. `MINIO_SECRET_KEY` - MinIO S3 secret key (API)

### Monitoring (1)
19. `GRAFANA_ADMIN_PASSWORD` - Grafana admin password

### Domain (2)
20. `DOMAIN` - Production domain (ex: `whalli.com`)
21. `ACME_EMAIL` - Email pour Let's Encrypt SSL

---

## 🔧 Prérequis

### GitHub CLI
```bash
# Installation
# Ubuntu/Debian
sudo apt install gh

# macOS
brew install gh

# Arch Linux
sudo pacman -S github-cli

# Authentification
gh auth login
```

### OpenSSL
```bash
# Vérifie si installé
openssl version

# Ubuntu/Debian
sudo apt install openssl

# macOS (pré-installé)
# Arch Linux
sudo pacman -S openssl
```

---

## 🔍 Vérification

### Vérifier les secrets GitHub
```bash
# Liste tous les secrets
gh secret list --repo Whalli/whalli

# Vérifier un secret spécifique (ne montre pas la valeur)
gh secret list --repo Whalli/whalli | grep DATABASE_URL
```

### Interface Web
https://github.com/Whalli/whalli/settings/secrets/actions

---

## 🛠️ Commandes Utiles

### Générer un secret aléatoire
```bash
openssl rand -base64 32
```

### Générer une clé SSH
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy_key
```

### Copier la clé publique sur le serveur
```bash
ssh-copy-id -i ~/.ssh/github_deploy_key.pub user@server
```

### Tester la connexion SSH
```bash
ssh -i ~/.ssh/github_deploy_key user@server
```

### Supprimer un secret
```bash
gh secret delete SECRET_NAME --repo Whalli/whalli
```

### Mettre à jour un secret
```bash
echo "new_value" | gh secret set SECRET_NAME --repo Whalli/whalli
```

---

## 🔐 Sécurité

### Bonnes Pratiques
1. ✅ Ne **jamais** commit les secrets dans Git
2. ✅ Utiliser des secrets différents pour staging/production
3. ✅ Régénérer les secrets tous les 90 jours
4. ✅ Utiliser une clé SSH dédiée pour le déploiement
5. ✅ Activer 2FA sur GitHub et tous les providers (Stripe, OpenAI, etc.)
6. ✅ Limiter les permissions de l'utilisateur SSH de déploiement
7. ✅ Supprimer les sauvegardes de secrets de `/tmp/` après vérification

### Fichiers à ne JAMAIS commit
- `.env`
- `.env.production`
- `*.pem`, `*.key` (clés privées)
- `/tmp/whalli-secrets-backup-*.txt`

---

## ❓ Dépannage

### "gh: command not found"
```bash
# Installer GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### "not authenticated with GitHub CLI"
```bash
gh auth login
# Suivre les instructions interactives
```

### "secret already exists"
Les secrets sont simplement écrasés, pas d'erreur.

### "permission denied"
Vérifier que vous avez les droits admin sur le repository Whalli/whalli.

---

## 📚 Documentation Complète

- [GITHUB_SECRETS_CHECKLIST.md](../GITHUB_SECRETS_CHECKLIST.md) - Liste de vérification complète
- [GITHUB_ACTIONS_DEPLOYMENT.md](../GITHUB_ACTIONS_DEPLOYMENT.md) - Guide déploiement GitHub Actions
- [ENVIRONMENT_VARIABLES_GUIDE.md](../ENVIRONMENT_VARIABLES_GUIDE.md) - Guide complet des variables d'environnement
- [.env.production.example](../.env.production.example) - Template de configuration

---

## 📝 Exemple d'Utilisation

```bash
# 1. Cloner le repository
git clone https://github.com/Whalli/whalli.git
cd whalli

# 2. Authentification GitHub CLI
gh auth login

# 3. Configuration automatique (18 secrets)
./scripts/auto-setup-secrets.sh

# 4. Configuration serveur (3 secrets)
./scripts/add-server-secrets.sh
# → Entrer IP serveur: 123.45.67.89
# → Entrer username: ubuntu
# → Choisir option 1 (générer nouvelle clé)
# → Copier la clé publique sur le serveur

# 5. Vérification
gh secret list --repo Whalli/whalli
# Devrait afficher 21 secrets

# 6. Tester le déploiement
# Aller sur: https://github.com/Whalli/whalli/actions/workflows/deploy.yml
# → Run workflow → production → Run
```

---

**Date**: 5 octobre 2025  
**Organisation**: Whalli  
**Repository**: https://github.com/Whalli/whalli  
**Maintainer**: Équipe Whalli
