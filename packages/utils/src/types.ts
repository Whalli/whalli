/**
 * Shared TypeScript Types
 * 
 * These types are used across the monorepo for type safety.
 * They match the Prisma schema but exclude sensitive fields.
 */

/**
 * User Roles
 */
export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

/**
 * Message Roles
 */
export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

/**
 * Safe User Type (excludes password and sensitive fields)
 */
export interface UserSafe {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Preset Type
 */
export interface Preset {
  id: string;
  name: string;
  color: string;
  systemInstruction: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Chat Type
 */
export interface Chat {
  id: string;
  title: string;
  model: string;
  presetId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message Type
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  chatId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Chat with Messages (populated)
 */
export interface ChatWithMessages extends Chat {
  messages: Message[];
  preset?: Preset | null;
}

/**
 * AI Model Configuration
 */
export interface AIModel {
  id: string;
  label: string;
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  contextWindow: number;
  maxTokens: number;
  supportsVision?: boolean;
  supportsStreaming?: boolean;
}

/**
 * Theme Configuration
 */
export interface Theme {
  id: string;
  label: string;
  value: string;
}

/**
 * Keybind Configuration
 */
export interface Keybind {
  id: string;
  label: string;
  keys: string[];
  action: string;
}

/**
 * API Response Types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Auth Types
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  user: UserSafe;
  tokens: AuthTokens;
}
