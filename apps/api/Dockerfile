# Multi-stage build for API
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install --frozen-lockfile

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

# Copy source code
COPY . .

# Build the app
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

ENV PORT 3001

CMD ["node", "apps/api/dist/main.js"]