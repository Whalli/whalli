# Package Documentation

Complete reference for all workspace packages.

## 📦 Available Packages

### `@whalli/prisma`
Database schema and Prisma Client generator.

**Location**: `packages/prisma`

**Purpose**: 
- Define database schema
- Generate type-safe database client
- Manage migrations
- **ISOLATED**: Only backend should import this

**Key Files**:
- `schema.prisma` - Database models
- `index.ts` - Exports Prisma Client

**Usage** (Backend only):
```typescript
import { PrismaClient } from '@whalli/prisma';

const prisma = new PrismaClient();
const users = await prisma.user.findMany();
```

**Scripts**:
```bash
pnpm --filter @whalli/prisma generate    # Generate client
pnpm --filter @whalli/prisma db:push     # Push schema
pnpm --filter @whalli/prisma migrate:dev # Create migration
pnpm --filter @whalli/prisma studio      # Open Prisma Studio
```

**Dependencies**:
- `@prisma/client`
- `prisma` (dev)

---

### `@whalli/utils`
Shared utility functions and schemas.

**Location**: `packages/utils`

**Purpose**:
- Framework-agnostic utilities
- Zod validation schemas
- Type definitions
- Helper functions

**Key Files**:
- `src/index.ts` - Utility functions
- `src/schemas.ts` - Zod schemas

**Usage**:
```typescript
import { cn, formatDate, capitalize } from '@whalli/utils';
import { emailSchema, userSchema } from '@whalli/utils/schemas';

// Merge Tailwind classes
const className = cn('text-base', 'font-bold');

// Format date
const formatted = formatDate(new Date());

// Validate with Zod
const email = emailSchema.parse('test@example.com');
```

**Exports**:

**Functions**:
- `cn(...inputs)` - Merge Tailwind classes
- `formatDate(date)` - Format date to readable string
- `sleep(ms)` - Async sleep utility
- `capitalize(str)` - Capitalize first letter

**Schemas**:
- `emailSchema` - Email validation
- `passwordSchema` - Password validation (min 8 chars)
- `userSchema` - User object validation

**Dependencies**:
- `zod` - Schema validation
- `clsx` - Class name utility
- `tailwind-merge` - Tailwind class merging

**Can be used by**: All apps and packages

---

### `@whalli/ui`
Shared React component library with Tailwind CSS.

**Location**: `packages/ui`

**Purpose**:
- Reusable UI components
- Consistent design system
- Tailwind CSS styling
- Accessible components

**Key Files**:
- `src/index.tsx` - Component exports
- `src/button.tsx` - Button component
- `src/card.tsx` - Card components
- `src/input.tsx` - Input component

**Usage**:
```typescript
import { Button, Card, CardHeader, CardTitle, Input } from '@whalli/ui';

// In your component
<Card>
  <CardHeader>
    <CardTitle>Hello</CardTitle>
  </CardHeader>
  <Button variant="outline">Click me</Button>
  <Input placeholder="Type here..." />
</Card>
```

**Components**:

#### Button
```typescript
<Button 
  variant="default|outline|ghost|destructive" 
  size="default|sm|lg|icon"
>
  Click me
</Button>
```

**Variants**:
- `default` - Solid dark button
- `outline` - Bordered button
- `ghost` - Minimal button
- `destructive` - Red danger button

**Sizes**:
- `default` - Standard size
- `sm` - Small button
- `lg` - Large button
- `icon` - Square icon button

#### Card
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

#### Input
```typescript
<Input 
  type="text|email|password|..." 
  placeholder="Enter text..."
/>
```

**Dependencies**:
- `@whalli/utils` - For `cn()` utility
- `react` - React library
- `lucide-react` - Icons
- `tailwindcss` - Styling

**Peer Dependencies**:
- `react ^18.2.0`
- `react-dom ^18.2.0`

**Can be used by**: Frontend apps (web, admin)

---

## 🎯 Package Usage Matrix

| Package | Backend | Web | Admin | UI | Utils |
|---------|---------|-----|-------|----|----|
| `@whalli/prisma` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `@whalli/utils` | ✅ | ✅ | ✅ | ✅ | - |
| `@whalli/ui` | ❌ | ✅ | ✅ | - | ❌ |

**Legend**:
- ✅ Can use
- ❌ Should not use
- `-` N/A

## 📝 Adding to Your Project

### Add dependency to app
```bash
pnpm add @whalli/<package> --filter @whalli/<your-app>
```

### Already configured in:
- **Backend**: `@whalli/prisma`, `@whalli/utils`
- **Web**: `@whalli/ui`, `@whalli/utils`
- **Admin**: `@whalli/ui`, `@whalli/utils`
- **UI**: `@whalli/utils`

## 🔧 Modifying Packages

### Add new utility function
```typescript
// packages/utils/src/index.ts
export function myNewUtil() {
  // implementation
}
```

### Add new UI component
```typescript
// 1. Create component file
// packages/ui/src/new-component.tsx

// 2. Export from index
// packages/ui/src/index.tsx
export { NewComponent } from './new-component';
```

### Add new Prisma model
```prisma
// packages/prisma/schema.prisma
model Post {
  id    String @id @default(cuid())
  title String
  // ... other fields
}
```

Then regenerate:
```bash
pnpm db:generate
```

## 🏗️ Package Structure

### Standard Package Layout
```
packages/<name>/
├── src/              # Source files
│   └── index.ts      # Main entry point
├── package.json      # Package config
├── tsconfig.json     # TypeScript config
└── README.md         # Documentation
```

### UI Package Layout
```
packages/ui/
├── src/
│   ├── index.tsx           # Exports
│   ├── component1.tsx
│   └── component2.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.js      # Tailwind config
└── postcss.config.js       # PostCSS config
```

## 📊 Version Management

All packages use workspace versioning:
- Version: `0.0.0`
- Private: `true` (not published to npm)

When referencing workspace packages:
```json
{
  "dependencies": {
    "@whalli/utils": "workspace:*"
  }
}
```

## 🧪 Testing Packages

```bash
# Type check
pnpm --filter @whalli/utils type-check

# Lint
pnpm --filter @whalli/ui lint

# Build (if applicable)
pnpm --filter @whalli/backend build
```

## 🔗 Import Aliases

Packages are imported using workspace names:

```typescript
// ✅ Correct
import { Button } from '@whalli/ui';
import { cn } from '@whalli/utils';
import { PrismaClient } from '@whalli/prisma';

// ❌ Wrong
import { Button } from '../../packages/ui/src/button';
```

## 📚 Additional Resources

- TypeScript Configuration: Root `tsconfig.json`
- ESLint Configuration: Root `.eslintrc.js`
- Prettier Configuration: Root `.prettierrc`

---

**Remember**: Keep packages focused and well-documented. Each package should have a single, clear purpose.
