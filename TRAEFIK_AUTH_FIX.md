# 🔐 Guide de correction TRAEFIK_AUTH

## ❌ Problème identifié

La variable `DdRltqSy` dans vos logs d'erreur fait référence à une **partie du hash htpasswd** pour Traefik.

**Variable problématique :**
```bash
TRAEFIK_AUTH=admin:$$apr1$DdRltqSy$$vukXkRTRc5124SnLTE3hr1
```

**Erreur Docker Compose :**
```
WARNING: The "DdRltqSy" variable is not set. Defaulting to a blank string.
```

## 🔍 Cause du problème

Docker Compose interprète les `$` simples comme des **substitutions de variables**, donc :
- `$DdRltqSy$` est interprété comme la variable `DdRltqSy`
- Au lieu d'être traité comme partie du hash htpasswd

## ✅ Solutions

### 1. **Échapper correctement les $ (Recommandé)**

```bash
# ❌ Incorrect (cause l'erreur)
TRAEFIK_AUTH=admin:$$apr1$DdRltqSy$$vukXkRTRc5124SnLTE3hr1

# ✅ Correct (échappé)
TRAEFIK_AUTH=admin:$$$$apr1$$DdRltqSy$$$$vukXkRTRc5124SnLTE3hr1
```

### 2. **Générer un nouveau hash**

```bash
# Générer un nouveau hash avec htpasswd
htpasswd -nb admin your-new-password

# Exemple de sortie:
# admin:$$apr1$$xyz123$$abcdefghijklmnop

# Échapper pour Docker Compose:
# admin:$$$$apr1$$$$xyz123$$$$abcdefghijklmnop
```

### 3. **Utiliser une autre méthode de hash**

```bash
# Utiliser bcrypt (plus moderne)
htpasswd -nbB admin your-password

# Ou SHA (évite certains caractères problématiques)
htpasswd -nbs admin your-password
```

## 🛠️ Correction pour Dokploy

Dans votre interface **Dokploy Environment Variables**, configurez :

```bash
# Variable à configurer :
TRAEFIK_AUTH

# Valeur (avec $ échappés) :
admin:$$$$apr1$$$$DdRltqSy$$$$vukXkRTRc5124SnLTE3hr1

# Ou générer une nouvelle avec :
htpasswd -nb admin your-secure-password | sed 's/\$/$$$$$/g'
```

## 🔧 Commandes utiles

```bash
# Générer un hash bcrypt (plus sûr)
htpasswd -nbB admin "your-secure-password"

# Échapper automatiquement pour Docker Compose
echo $(htpasswd -nb admin "your-password") | sed 's/\$/$$$$$/g'

# Tester l'authentification
curl -u admin:your-password https://traefik.yourdomain.com
```

## 📝 Variables similaires

Les mêmes règles s'appliquent pour :
- `PROMETHEUS_AUTH` (même format htpasswd)
- Toute autre variable contenant des hashs avec `$`

## ✅ Vérification

Après correction, vous ne devriez plus voir ces erreurs :
- ❌ `The "DdRltqSy" variable is not set`
- ❌ `The "v2R" variable is not set` (probablement dans PROMETHEUS_AUTH)

Le problème vient d'un **mauvais échappement des caractères `$`** dans les hashs htpasswd ! 🔐