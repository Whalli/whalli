/**
 * @whalli/prisma
 * 
 * ⚠️ CRITICAL: BACKEND ONLY
 * 
 * This package should ONLY be imported by the backend app (apps/backend).
 * Frontend apps (apps/web, apps/admin) should NEVER import this package.
 * 
 * WHY?
 * - Security: Prevents exposing database credentials to the frontend
 * - Separation of Concerns: Frontend communicates via API only
 * - Best Practice: Backend owns all database access
 * 
 * USAGE (Backend only):
 * ```typescript
 * import { prisma } from '@whalli/prisma';
 * 
 * const users = await prisma.user.findMany();
 * ```
 */

import { PrismaClient } from './generated/client/index.js';

// Global declaration for singleton pattern
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Singleton instance
export const prisma =
  global.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Re-export everything from generated client
export * from './generated/client/index.js';