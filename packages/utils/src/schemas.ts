import { z } from 'zod';

/**
 * Zod Validation Schemas
 * 
 * These schemas are used for runtime validation across the application.
 * They ensure data integrity for API requests and responses.
 */

// ============================================================================
// Base Validators
// ============================================================================

export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters');

export const uuidSchema = z.string().uuid('Invalid UUID');

// ============================================================================
// Auth Schemas
// ============================================================================

/**
 * Login Schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Register Schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Change Password Schema
 */
export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Reset Password Schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ============================================================================
// User Schemas
// ============================================================================

/**
 * Update User Profile Schema
 */
export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: emailSchema.optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ============================================================================
// Chat Schemas
// ============================================================================

/**
 * Create Chat Schema
 */
export const createChatSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  model: z.string().min(1, 'Model is required'),
  presetId: uuidSchema.optional(),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;

/**
 * Update Chat Schema
 */
export const updateChatSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  model: z.string().min(1).optional(),
  presetId: uuidSchema.nullable().optional(),
});

export type UpdateChatInput = z.infer<typeof updateChatSchema>;

// ============================================================================
// Message Schemas
// ============================================================================

/**
 * Message Role Schema
 */
export const messageRoleSchema = z.enum(['USER', 'ASSISTANT', 'SYSTEM']);

/**
 * Create Message Schema (send message in chat)
 */
export const createMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(50000, 'Message is too long'),
  role: messageRoleSchema.default('USER'),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

/**
 * Stream Chat Schema (for streaming responses)
 */
export const streamChatSchema = z.object({
  chatId: uuidSchema,
  message: z.string().min(1).max(50000),
});

export type StreamChatInput = z.infer<typeof streamChatSchema>;

// ============================================================================
// Preset Schemas
// ============================================================================

/**
 * Create Preset Schema
 */
export const createPresetSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color'),
  systemInstruction: z
    .string()
    .min(1, 'System instruction is required')
    .max(5000, 'System instruction is too long'),
});

export type CreatePresetInput = z.infer<typeof createPresetSchema>;

/**
 * Update Preset Schema
 */
export const updatePresetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  systemInstruction: z.string().min(1).max(5000).optional(),
});

export type UpdatePresetInput = z.infer<typeof updatePresetSchema>;

// ============================================================================
// Pagination Schemas
// ============================================================================

/**
 * Pagination Query Schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Search Query Schema
 */
export const searchSchema = z.object({
  query: z.string().min(1).max(200),
  ...paginationSchema.shape,
});

export type SearchInput = z.infer<typeof searchSchema>;
