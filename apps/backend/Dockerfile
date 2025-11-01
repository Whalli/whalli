FROM node:20-alpine AS base

# Install pnpm and bash
RUN apk add --no-cache bash && npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy all packages
COPY packages ./packages
COPY apps/backend ./apps/backend

# Install dependencies (updated for @nestjs/cli)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm --filter @whalli/prisma generate

# Development stage
FROM base AS development
WORKDIR /app
ENV NODE_ENV=development
EXPOSE 3000
CMD ["pnpm", "--filter", "@whalli/backend", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app
RUN pnpm --filter @whalli/backend build

# Production stage
FROM node:20-alpine AS production
RUN apk add --no-cache bash && npm install -g pnpm
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./

# Copy built backend
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/packages ./packages

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma Client
RUN pnpm --filter @whalli/prisma generate

EXPOSE 3000
CMD ["node", "apps/backend/dist/main.js"]
