/**
 * Global type declarations for browser APIs
 * This allows the package to be used in both Node.js and browser environments
 */

declare global {
  const window: Window | undefined;
  const navigator: Navigator | undefined;
}

export {};
