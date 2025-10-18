/**
 * Auth Server - DEPRECATED
 * Better Auth is now handled by the API backend.
 * All authentication is proxied through the API at apps/api/src/auth/auth.controller.ts
 * 
 * This file is kept for backwards compatibility and reference.
 */

export type Session = {
  user?: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
};