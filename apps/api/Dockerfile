# Multi-stage build for API
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml .npmrc* ./
COPY pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

# Generate Prisma client
FROM deps AS prisma
WORKDIR /app
COPY apps/api/prisma ./apps/api/prisma
RUN cd apps/api && pnpm prisma generate

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy ALL from deps stage (node_modules + workspace structure)
COPY --from=deps /app ./

# Copy workspace configuration and source code
COPY turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Copy Prisma Client from prisma stage (after sources to avoid overwrite)
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma

# Build the app (Turborepo will build dependencies first)
RUN pnpm build --filter=@whalli/api

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nestjs
RUN adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/package.json ./

USER nestjs

EXPOSE 3001

ENV PORT=3001

CMD ["node", "apps/api/dist/main.js"]