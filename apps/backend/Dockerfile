FROM node:20-alpine AS base

# Install pnpm and Bun
RUN npm install -g pnpm && \
    npm install -g bun

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy all packages with their package.json
COPY packages ./packages
COPY apps/backend ./apps/backend

# Install dependencies with pnpm (garantit les dépendances correctes)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
WORKDIR /app/packages/prisma
RUN pnpm run generate
WORKDIR /app

# Development stage
FROM base AS development
WORKDIR /app/apps/backend
ENV NODE_ENV=development
EXPOSE 3000
CMD ["bun", "--watch", "src/main.ts"]

# Build stage
FROM base AS builder
WORKDIR /app/apps/backend
RUN bun run build

# Production stage
FROM node:20-alpine AS production
RUN npm install -g pnpm
WORKDIR /app

# Copy package files
COPY --from=base /app/package.json ./
COPY --from=base /app/turbo.json ./

# Copy built backend
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/

# Copy packages with generated Prisma Client
COPY --from=base /app/packages ./packages

# Copy node_modules from base (already installed)
COPY --from=base /app/node_modules ./node_modules

WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["node", "dist/main.js"]
