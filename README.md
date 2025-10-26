# Whalli Monorepo

A modern full-stack monorepo built with Turborepo, pnpm workspaces, and TypeScript.

## 🏗️ Architecture

This monorepo contains:

### Apps
- **`apps/backend`** - NestJS API server with Prisma ORM (only consumer of Prisma client)
- **`apps/web`** - Next.js 14 App Router (public-facing web application)
- **`apps/admin`** - Next.js 14 App Router (admin panel)

### Packages
- **`packages/prisma`** - Prisma schema and generated client (isolated to backend only)
- **`packages/utils`** - Shared utilities (TypeScript, Zod schemas, helper functions)
- **`packages/ui`** - Shared React components with Tailwind CSS

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
pnpm db:generate

# Set up environment variables
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
cp packages/prisma/.env.example packages/prisma/.env

# Update DATABASE_URL in packages/prisma/.env and apps/backend/.env
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter @whalli/web dev
pnpm --filter @whalli/admin dev
pnpm --filter @whalli/backend dev

# Generate Prisma Client after schema changes
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Create and run migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

### Building

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter @whalli/web build
```

### Linting & Formatting

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check

# Type check
pnpm type-check
```

## 📁 Project Structure

```
whalli/
├── apps/
│   ├── backend/          # NestJS API (port 4000)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── prisma/   # Prisma service (only consumer of @whalli/prisma)
│   │   │   └── users/
│   │   └── package.json
│   ├── web/              # Next.js web app (port 3000)
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── package.json
│   └── admin/            # Next.js admin (port 3001)
│       ├── app/
│       │   ├── layout.tsx
│       │   └── page.tsx
│       └── package.json
├── packages/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── index.ts
│   │   └── package.json
│   ├── utils/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── schemas.ts
│   │   └── package.json
│   └── ui/
│       ├── src/
│       │   ├── index.tsx
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   └── input.tsx
│       └── package.json
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── turbo.json
```

## 🔒 Architecture Principles

### Isolation
- **Backend is the only consumer of Prisma Client** - This enforces proper separation of concerns
- Frontend apps communicate with backend via REST/GraphQL APIs only
- Shared code lives in `packages/utils` and `packages/ui`

### Type Safety
- Strict TypeScript across all packages
- Zod for runtime validation
- Shared types in `packages/utils`

### Styling
- Tailwind CSS for all UI
- Shared components in `packages/ui`
- `cn()` utility for class merging

## 🛠️ Tech Stack

### Backend
- NestJS
- Prisma ORM
- PostgreSQL
- TypeScript

### Frontend
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- TypeScript

### Shared
- Turborepo
- pnpm workspaces
- ESLint + Prettier
- Zod
- Lucide React (icons)

## 📝 Scripts Reference

### Root Level
- `pnpm dev` - Run all apps in dev mode
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all packages
- `pnpm format` - Format all files
- `pnpm type-check` - Type check all packages
- `pnpm clean` - Clean all build artifacts

### Database (Prisma)
- `pnpm db:generate` - Generate Prisma Client
- `pnpm db:push` - Push schema to database
- `pnpm db:migrate` - Create and run migrations
- `pnpm db:studio` - Open Prisma Studio

### Individual Apps
```bash
# Web app (port 3000)
pnpm --filter @whalli/web dev
pnpm --filter @whalli/web build

# Admin app (port 3001)
pnpm --filter @whalli/admin dev
pnpm --filter @whalli/admin build

# Backend (port 4000)
pnpm --filter @whalli/backend dev
pnpm --filter @whalli/backend build
```

## 🌍 Environment Variables

### Backend (`apps/backend/.env`)
```env
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
DATABASE_URL="postgresql://user:password@localhost:5432/whalli?schema=public"
```

### Prisma (`packages/prisma/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/whalli?schema=public"
```

### Web & Admin (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 📦 Adding Dependencies

```bash
# Add to root
pnpm add -w <package>

# Add to specific app/package
pnpm add <package> --filter @whalli/web

# Add dev dependency
pnpm add -D <package> --filter @whalli/backend
```

## 🚢 Deployment

Each app can be deployed independently:

- **Backend**: Deploy to any Node.js hosting (Heroku, Railway, Fly.io)
- **Web/Admin**: Deploy to Vercel, Netlify, or any Next.js hosting
- **Database**: Use managed PostgreSQL (Supabase, Neon, Railway)

Remember to:
1. Set environment variables on each platform
2. Run `pnpm db:generate` during build
3. Run migrations in production

## 📚 Additional Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

## 🤝 Contributing

1. Create a new branch
2. Make your changes
3. Run `pnpm lint` and `pnpm type-check`
4. Commit with clear messages
5. Open a pull request

## 📄 License

MIT
