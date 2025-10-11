# Multi-stage build for Admin
FROM node:18-alpine AS base

# Install pnpm
RUN apk add --no-cache openssl \
    && npm install -g pnpm@8

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml .npmrc* ./
COPY pnpm-workspace.yaml ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

# Generate Prisma client (needed for Better Auth)
FROM deps AS prisma
WORKDIR /app
COPY apps/api/prisma ./apps/api/prisma
RUN PRISMA_GENERATE_SKIP_AUTOINSTALL=1 /app/node_modules/.bin/prisma generate --schema=apps/api/prisma/schema.prisma

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy ALL from deps stage (node_modules + workspace structure)
COPY --from=deps /app ./

# Copy workspace configuration and source code
COPY turbo.json ./
COPY packages ./packages
COPY apps/admin ./apps/admin

# Copy Prisma Client from prisma stage (after sources to avoid overwrite)
COPY --from=prisma /app/node_modules ./node_modules

# Build the app (Turborepo will build dependencies first)
RUN pnpm build --filter=@whalli/admin

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/admin/server.js"]
