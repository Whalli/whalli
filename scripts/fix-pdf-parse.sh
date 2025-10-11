#!/bin/bash

# Script pour corriger le problème ESM avec pdf-parse et pdfjs-dist
# Ce script force l'utilisation de pdfjs-dist version 4.x compatible

set -e

echo "🔧 Correction du problème ESM pdf-parse/pdfjs-dist..."

# Supprimer node_modules et pnpm-lock.yaml pour forcer une réinstallation propre
echo "📦 Nettoyage des dépendances..."
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm -f pnpm-lock.yaml

# Réinstaller avec les résolutions forcées
echo "⬇️ Réinstallation des dépendances avec pdfjs-dist@4.7.76..."
pnpm install

echo "✅ Correction terminée!"
echo ""
echo "📋 Changements appliqués:"
echo "  - pdfjs-dist forcé à la version 4.7.76 (compatible CommonJS)"
echo "  - Nettoyage complet des node_modules"
echo "  - Réinstallation propre des dépendances"
echo ""
echo "🚀 Vous pouvez maintenant rebuilder votre application:"
echo "  pnpm build"