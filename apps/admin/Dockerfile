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
COPY apps/admin ./apps/admin

# Install dependencies
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
WORKDIR /app
EXPOSE 3000
CMD ["pnpm", "--filter", "@whalli/admin", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED 1

RUN pnpm --filter @whalli/admin build

# Production stage
FROM node:20-alpine AS production
RUN npm install -g pnpm
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --from=builder /app/apps/admin/next.config.js ./apps/admin/
COPY --from=builder /app/apps/admin/package.json ./apps/admin/
COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder /app/packages ./packages

# Copy public folder if it exists (optional)
RUN mkdir -p ./apps/admin/public

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000
WORKDIR /app/apps/admin
CMD ["pnpm", "start"]
