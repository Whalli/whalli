# Multi-stage build for API
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/*/

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

# Copy dependencies and prisma client
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma

# Copy workspace configuration
COPY pnpm-workspace.yaml turbo.json package.json ./

# Copy packages source code (needed for internal dependencies)
COPY packages ./packages

# Copy app source code and prisma schema
COPY apps/api ./apps/api

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