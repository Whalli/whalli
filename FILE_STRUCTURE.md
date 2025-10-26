# Whalli Monorepo - File Structure

```
whalli/
├── README.md                       # Main project documentation
├── SETUP.md                        # Setup instructions
├── ARCHITECTURE.md                 # Architecture diagrams
├── CHEATSHEET.md                   # Quick reference
├── CONTRIBUTING.md                 # Contribution guidelines
├── PROJECT_SUMMARY.md              # Setup completion summary
│
├── package.json                    # Root package configuration
├── pnpm-workspace.yaml            # pnpm workspace config
├── pnpm-lock.yaml                 # Dependency lock file
├── turbo.json                     # Turborepo configuration
├── tsconfig.json                  # Base TypeScript config
│
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── .gitignore                     # Git ignore rules
├── .npmrc                         # pnpm configuration
├── setup.sh                       # Automated setup script
│
├── apps/
│   ├── backend/                   # NestJS Backend (Port 4000)
│   │   ├── src/
│   │   │   ├── main.ts           # Entry point
│   │   │   ├── app.module.ts     # Root module
│   │   │   ├── app.controller.ts # Root controller
│   │   │   ├── app.service.ts    # Root service
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.module.ts
│   │   │   │   └── prisma.service.ts
│   │   │   └── users/
│   │   │       ├── users.module.ts
│   │   │       ├── users.controller.ts
│   │   │       ├── users.service.ts
│   │   │       └── dto/
│   │   │           └── create-user.dto.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   └── .env.example
│   │
│   ├── web/                       # Next.js Web (Port 3000)
│   │   ├── app/
│   │   │   ├── layout.tsx        # Root layout
│   │   │   ├── page.tsx          # Home page
│   │   │   └── globals.css       # Global styles
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── .eslintrc.json
│   │   └── .env.example
│   │
│   └── admin/                     # Next.js Admin (Port 3001)
│       ├── app/
│       │   ├── layout.tsx        # Root layout
│       │   ├── page.tsx          # Admin dashboard
│       │   └── globals.css       # Global styles
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── .eslintrc.json
│       └── .env.example
│
└── packages/
    ├── prisma/                    # Database Package
    │   ├── schema.prisma         # Prisma schema
    │   ├── index.ts              # Prisma client export
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── README.md
    │   └── .env.example
    │
    ├── utils/                     # Shared Utilities
    │   ├── src/
    │   │   ├── index.ts          # Main exports (cn, formatDate, etc.)
    │   │   └── schemas.ts        # Zod validation schemas
    │   ├── package.json
    │   └── tsconfig.json
    │
    └── ui/                        # Shared UI Components
        ├── src/
        │   ├── index.tsx         # Component exports
        │   ├── button.tsx        # Button component
        │   ├── card.tsx          # Card components
        │   └── input.tsx         # Input component
        ├── package.json
        ├── tsconfig.json
        ├── tailwind.config.js
        └── postcss.config.js
```

## File Count Summary

### Apps
- **Backend**: ~15 files (NestJS structure)
- **Web**: ~8 files (Next.js App Router)
- **Admin**: ~8 files (Next.js App Router)

### Packages
- **Prisma**: ~6 files
- **Utils**: ~4 files
- **UI**: ~8 files

### Configuration
- **Root**: 12 files

### Documentation
- **Docs**: 6 markdown files

**Total**: ~67 source files (excluding node_modules)

## Key Files Explained

### Root Configuration
- `turbo.json` - Defines build pipeline and task dependencies
- `pnpm-workspace.yaml` - Declares workspace packages
- `tsconfig.json` - Base TypeScript configuration inherited by all packages

### Backend
- `main.ts` - Bootstrap NestJS application
- `prisma.service.ts` - Prisma client singleton (only Prisma consumer)
- `users.controller.ts` - Example REST endpoints

### Frontend (Web & Admin)
- `app/layout.tsx` - Root layout with font loading
- `app/page.tsx` - Main page using shared UI components
- `next.config.js` - Transpiles workspace packages

### Packages
- `packages/prisma/schema.prisma` - Database models
- `packages/utils/src/index.ts` - Utility functions
- `packages/ui/src/button.tsx` - Button component with variants

## Import Patterns

### Backend imports Prisma
```typescript
// ✅ ALLOWED in apps/backend
import { PrismaClient } from '@whalli/prisma';
```

### Frontend imports UI & Utils
```typescript
// ✅ apps/web, apps/admin
import { Button, Card } from '@whalli/ui';
import { cn, formatDate } from '@whalli/utils';
```

### UI imports Utils
```typescript
// ✅ packages/ui
import { cn } from '@whalli/utils';
```

## Generated Files (Not in Git)

```
node_modules/              # Dependencies
.next/                     # Next.js build output
.turbo/                    # Turborepo cache
dist/                      # Build output
packages/prisma/generated/ # Generated Prisma Client
*.tsbuildinfo              # TypeScript build cache
.env                       # Environment variables
.env.local                 # Local environment overrides
```

---

This structure provides:
- ✅ Clear separation of apps and packages
- ✅ Shared configuration at root level
- ✅ Type-safe imports across workspace
- ✅ Optimized builds with Turborepo
- ✅ Independent deployments
