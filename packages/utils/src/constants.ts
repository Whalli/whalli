/**
 * Application Constants
 * 
 * Centralized constants for AI models, themes, keybinds, and other configuration.
 */

import type { AIModel, Theme, Keybind } from './types';

// ============================================================================
// AI Models
// ============================================================================

/**
 * Available AI Models
 */
export const AI_MODELS: readonly AIModel[] = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'openai',
    contextWindow: 128000,
    maxTokens: 4096,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: 'gpt-4-turbo',
    label: 'GPT-4 Turbo',
    provider: 'openai',
    contextWindow: 128000,
    maxTokens: 4096,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: 'gpt-4',
    label: 'GPT-4',
    provider: 'openai',
    contextWindow: 8192,
    maxTokens: 4096,
    supportsVision: false,
    supportsStreaming: true,
  },
  {
    id: 'gpt-3.5-turbo',
    label: 'GPT-3.5 Turbo',
    provider: 'openai',
    contextWindow: 16385,
    maxTokens: 4096,
    supportsVision: false,
    supportsStreaming: true,
  },
  
  // Anthropic Models
  {
    id: 'claude-3-opus',
    label: 'Claude 3 Opus',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 4096,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: 'claude-3-sonnet',
    label: 'Claude 3 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 4096,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: 'claude-3-haiku',
    label: 'Claude 3 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 4096,
    supportsVision: true,
    supportsStreaming: true,
  },
  
  // Google Models
  {
    id: 'gemini-pro',
    label: 'Gemini Pro',
    provider: 'google',
    contextWindow: 32768,
    maxTokens: 8192,
    supportsVision: false,
    supportsStreaming: true,
  },
  {
    id: 'gemini-pro-vision',
    label: 'Gemini Pro Vision',
    provider: 'google',
    contextWindow: 16384,
    maxTokens: 2048,
    supportsVision: true,
    supportsStreaming: true,
  },
] as const;

/**
 * Get AI model by ID
 */
export function getAIModel(id: string): AIModel | undefined {
  return AI_MODELS.find((model) => model.id === id);
}

/**
 * Get AI models by provider
 */
export function getAIModelsByProvider(
  provider: AIModel['provider'],
): AIModel[] {
  return AI_MODELS.filter((model) => model.provider === provider);
}

// ============================================================================
// Themes
// ============================================================================

/**
 * Available Themes
 */
export const THEMES: readonly Theme[] = [
  { id: 'light', label: 'Light', value: 'light' },
  { id: 'dark', label: 'Dark', value: 'dark' },
  { id: 'system', label: 'System', value: 'system' },
] as const;

/**
 * Default Theme
 */
export const DEFAULT_THEME = 'system';

// ============================================================================
// Colors (for Presets)
// ============================================================================

/**
 * Preset Color Palette
 */
export const PRESET_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#10B981', // emerald
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
  '#F43F5E', // rose
] as const;

/**
 * Default Preset Color
 */
export const DEFAULT_PRESET_COLOR = PRESET_COLORS[11]; // blue

// ============================================================================
// Keybinds
// ============================================================================

/**
 * Application Keybinds
 */
export const KEYBINDS: readonly Keybind[] = [
  // Chat Actions
  {
    id: 'new-chat',
    label: 'New Chat',
    keys: ['Meta', 'K'],
    action: 'newChat',
  },
  {
    id: 'focus-input',
    label: 'Focus Input',
    keys: ['Meta', 'L'],
    action: 'focusInput',
  },
  {
    id: 'toggle-sidebar',
    label: 'Toggle Sidebar',
    keys: ['Meta', 'B'],
    action: 'toggleSidebar',
  },
  {
    id: 'search-chats',
    label: 'Search Chats',
    keys: ['Meta', 'F'],
    action: 'searchChats',
  },
  
  // Message Actions
  {
    id: 'send-message',
    label: 'Send Message',
    keys: ['Enter'],
    action: 'sendMessage',
  },
  {
    id: 'new-line',
    label: 'New Line',
    keys: ['Shift', 'Enter'],
    action: 'newLine',
  },
  {
    id: 'stop-generation',
    label: 'Stop Generation',
    keys: ['Escape'],
    action: 'stopGeneration',
  },
  
  // Navigation
  {
    id: 'go-to-settings',
    label: 'Go to Settings',
    keys: ['Meta', ','],
    action: 'goToSettings',
  },
  {
    id: 'toggle-theme',
    label: 'Toggle Theme',
    keys: ['Meta', 'Shift', 'T'],
    action: 'toggleTheme',
  },
  
  // Edit Actions
  {
    id: 'copy-code',
    label: 'Copy Code Block',
    keys: ['Meta', 'Shift', 'C'],
    action: 'copyCode',
  },
  {
    id: 'regenerate',
    label: 'Regenerate Response',
    keys: ['Meta', 'R'],
    action: 'regenerate',
  },
] as const;

/**
 * Get keybind by ID
 */
export function getKeybind(id: string): Keybind | undefined {
  return KEYBINDS.find((keybind) => keybind.id === id);
}

/**
 * Format keybind keys for display
 */
export function formatKeybind(keys: string[]): string {
  return keys
    .map((key) => {
      // Replace Meta with appropriate symbol based on platform
      if (key === 'Meta') {
        // Check if running in browser and on Mac
        if (typeof globalThis !== 'undefined' && typeof (globalThis as any).navigator !== 'undefined') {
          return (globalThis as any).navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';
        }
        return 'Ctrl';
      }
      if (key === 'Shift') return '⇧';
      if (key === 'Alt') return '⌥';
      if (key === 'Enter') return '↵';
      if (key === 'Escape') return 'Esc';
      return key;
    })
    .join(' + ');
}

// ============================================================================
// API Configuration
// ============================================================================

/**
 * Default Pagination
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Rate Limits
 */
export const RATE_LIMITS = {
  MESSAGES_PER_MINUTE: 60,
  CHATS_PER_DAY: 100,
  PRESETS_PER_USER: 50,
} as const;

/**
 * Message Limits
 */
export const MESSAGE_LIMITS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 50000,
} as const;

/**
 * Chat Limits
 */
export const CHAT_LIMITS = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
} as const;

/**
 * Preset Limits
 */
export const PRESET_LIMITS = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  INSTRUCTION_MIN_LENGTH: 1,
  INSTRUCTION_MAX_LENGTH: 5000,
} as const;

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Common Error Messages
 */
export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  
  // Validation
  INVALID_INPUT: 'Invalid input',
  REQUIRED_FIELD: 'This field is required',
  
  // Not Found
  USER_NOT_FOUND: 'User not found',
  CHAT_NOT_FOUND: 'Chat not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  PRESET_NOT_FOUND: 'Preset not found',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
  
  // Server
  INTERNAL_SERVER_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service unavailable',
} as const;

// ============================================================================
// Success Messages
// ============================================================================

/**
 * Common Success Messages
 */
export const SUCCESS_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Successfully logged in',
  LOGOUT_SUCCESS: 'Successfully logged out',
  REGISTER_SUCCESS: 'Successfully registered',
  
  // CRUD
  CREATED: 'Successfully created',
  UPDATED: 'Successfully updated',
  DELETED: 'Successfully deleted',
  
  // Specific
  CHAT_CREATED: 'Chat created successfully',
  PRESET_CREATED: 'Preset created successfully',
  MESSAGE_SENT: 'Message sent successfully',
} as const;
