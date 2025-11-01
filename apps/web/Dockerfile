FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy all packages
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
WORKDIR /app
EXPOSE 3000
CMD ["pnpm", "--filter", "@whalli/web", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED 1

RUN pnpm --filter @whalli/web build

# Production stage
FROM node:20-alpine AS production
RUN npm install -g pnpm
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --from=builder /app/apps/web/next.config.js ./apps/web/
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/packages ./packages

# Copy public folder if it exists (optional)
RUN mkdir -p ./apps/web/public

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000
WORKDIR /app/apps/web
CMD ["pnpm", "start"]
