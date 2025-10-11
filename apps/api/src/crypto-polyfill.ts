// Crypto polyfill for Node.js compatibility
// This ensures crypto is available globally for @nestjs/schedule

import { webcrypto } from 'node:crypto';

// Make crypto available globally if not already present
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

// For older Node.js versions, also ensure it's available on global
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = webcrypto;
}

export {};