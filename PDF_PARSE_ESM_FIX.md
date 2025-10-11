# 🐛 Fix: ERR_REQUIRE_ESM pdf-parse/pdfjs-dist

## ❌ Problème

```bash
Error [ERR_REQUIRE_ESM]: require() of ES Module /app/node_modules/.pnpm/pdfjs-dist@5.4.149/node_modules/pdfjs-dist/legacy/build/pdf.mjs not supported.
```

## 🔍 Cause

- `pdf-parse@2.1.6` utilise `require()` pour importer `pdfjs-dist`
- `pdfjs-dist@5.x` est devenu un module ES pur (ESM)
- Conflit entre CommonJS (`require`) et ES modules (`import`)

## ✅ Solution appliquée

### 1. **Résolution de version forcée**

Dans `package.json` (racine) :
```json
{
  "pnpm": {
    "overrides": {
      "pdfjs-dist": "4.7.76"
    }
  }
}
```

### 2. **Script de correction**

Exécutez `./scripts/fix-pdf-parse.sh` pour :
- Nettoyer les `node_modules`
- Supprimer `pnpm-lock.yaml`
- Réinstaller avec la version forcée

### 3. **Dockerfile mis à jour**

Le Dockerfile API utilise maintenant la résolution forcée.

## 🚀 Instructions de correction

### En développement local :
```bash
# Exécuter le script de correction
./scripts/fix-pdf-parse.sh

# Ou manuellement :
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### En production (Docker) :
```bash
# Rebuilder l'image Docker
docker-compose build api workers

# Ou avec cache nettoyé :
docker-compose build --no-cache api workers
```

## 📋 Vérification

Après correction, vérifiez que :
```bash
# La version de pdfjs-dist est correcte
pnpm list pdfjs-dist
# Devrait afficher: pdfjs-dist@4.7.76

# L'application démarre sans erreur
pnpm dev
# ou
docker-compose up
```

## 🔧 Alternatives possibles

Si le problème persiste :

### Option 1: Remplacer pdf-parse
```bash
pnpm remove pdf-parse
pnpm add pdf2pic  # Alternative qui supporte ESM
```

### Option 2: Utiliser une version spécifique
```json
{
  "dependencies": {
    "pdf-parse": "1.1.1",
    "pdfjs-dist": "4.7.76"
  }
}
```

### Option 3: Import dynamique
Modifier le code pour utiliser `import()` au lieu de `require()`.

## 📝 Notes

- `pdfjs-dist@4.7.76` est la dernière version compatible CommonJS
- `pdfjs-dist@5.x+` nécessite des imports ES modules
- La résolution forcée garantit la compatibilité avec `pdf-parse`

Cette solution maintient la fonctionnalité PDF tout en résolvant le conflit ESM/CommonJS ! 🎉