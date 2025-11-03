FROM node:20-slim

# Installer pnpm et OpenSSL pour Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/* && npm install -g pnpm

# Créer et définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration du workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./

# Copier tous les packages et apps nécessaires
COPY packages ./packages
COPY apps/backend ./apps/backend

# Installer toutes les dépendances
RUN pnpm install --frozen-lockfile

# Supprimer explicitement le dossier generated s'il existe (copié depuis macOS)
RUN rm -rf packages/prisma/generated || true

# Générer le client Prisma avec les bons binaires Linux
RUN cd packages/prisma && pnpm run generate

# Vérifier que les binaires nécessaires ont été générés
RUN ls -la packages/prisma/generated/client/libquery_engine-*.so.node

# Exposer le port
EXPOSE 3000

# Démarrer avec ts-node pour éviter les problèmes de chemins hardcodés
CMD ["pnpm", "--filter", "@whalli/backend", "start:dev"]
