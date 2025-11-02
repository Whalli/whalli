FROM node:20-alpine

# Installer pnpm et OpenSSL pour Prisma
RUN apk add --no-cache openssl && npm install -g pnpm

# Créer et définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration du workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./

# Copier tous les packages et apps nécessaires
COPY packages ./packages
COPY apps/backend ./apps/backend

# Installer toutes les dépendances
RUN pnpm install --frozen-lockfile

# Générer le client Prisma
RUN cd packages/prisma && pnpm run generate

# Build l'application backend
RUN cd apps/backend && pnpm run build

# Exposer le port
EXPOSE 3000

# Définir le répertoire de travail pour le backend
WORKDIR /app/apps/backend

# Démarrer en mode production
CMD ["node", "dist/main.js"]
