/**
 * Example Usage of @whalli/utils
 * 
 * This file demonstrates how to use types, schemas, constants, and utilities
 * from the @whalli/utils package across the monorepo.
 */

import {
  // Types
  type UserSafe,
  type Chat,
  type Message,
  type Preset,
  type AIModel,
  type ApiResponse,
  
  // Schemas
  loginSchema,
  registerSchema,
  createChatSchema,
  createMessageSchema,
  createPresetSchema,
  
  // Constants
  AI_MODELS,
  PRESET_COLORS,
  KEYBINDS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  getAIModel,
  formatKeybind,
  
  // Utilities
  cn,
  formatDate,
  formatRelativeTime,
  capitalize,
  truncate,
  debounce,
  isBrowser,
} from '@whalli/utils';

// ============================================================================
// 1. Type Usage
// ============================================================================

const user: UserSafe = {
  id: 'user-123',
  email: 'john@example.com',
  name: 'John Doe',
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const chat: Chat = {
  id: 'chat-123',
  title: 'My Chat',
  model: 'gpt-4-turbo',
  presetId: null,
  userId: user.id,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const message: Message = {
  id: 'msg-123',
  role: 'USER',
  content: 'Hello, world!',
  chatId: chat.id,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================================================
// 2. Schema Validation
// ============================================================================

// Validate login input
const loginResult = loginSchema.safeParse({
  email: 'john@example.com',
  password: 'password123',
});

if (loginResult.success) {
  console.log('Valid login:', loginResult.data);
} else {
  console.error('Invalid login:', loginResult.error);
}

// Validate chat creation
const chatResult = createChatSchema.safeParse({
  title: 'New Chat',
  model: 'gpt-4-turbo',
});

if (chatResult.success) {
  console.log('Valid chat:', chatResult.data);
}

// Validate preset creation
const presetResult = createPresetSchema.safeParse({
  name: 'Helpful Assistant',
  color: '#3B82F6',
  systemInstruction: 'You are a helpful assistant.',
});

// ============================================================================
// 3. Constants Usage
// ============================================================================

// Get all GPT models
console.log('Available models:', AI_MODELS.length);

// Get specific model
const gpt4 = getAIModel('gpt-4-turbo');
if (gpt4) {
  console.log(`${gpt4.label}: ${gpt4.contextWindow} tokens`);
}

// Use preset colors
const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
console.log('Random color:', randomColor);

// Format keybind for display
const newChatKeybind = KEYBINDS.find(k => k.id === 'new-chat');
if (newChatKeybind) {
  console.log(`${newChatKeybind.label}: ${formatKeybind(newChatKeybind.keys)}`);
}

// Use error messages
console.log('Auth error:', ERROR_MESSAGES.INVALID_CREDENTIALS);
console.log('Success:', SUCCESS_MESSAGES.LOGIN_SUCCESS);

// ============================================================================
// 4. Utility Functions
// ============================================================================

// Merge CSS classes
const buttonClass = cn(
  'px-4 py-2 rounded',
  user.role === 'ADMIN' && 'bg-red-500',
  'hover:opacity-80'
);

// Format dates
console.log('Formatted date:', formatDate(chat.createdAt));
console.log('Relative time:', formatRelativeTime(chat.createdAt));

// String utilities
console.log('Capitalized:', capitalize('hello world'));
console.log('Truncated:', truncate('This is a very long message', 10));

// Debounce example
const debouncedSearch = debounce((query: string) => {
  console.log('Searching for:', query);
}, 300);

// Browser check
if (isBrowser()) {
  console.log('Running in browser');
} else {
  console.log('Running on server');
}

// ============================================================================
// 5. API Response Example
// ============================================================================

const successResponse: ApiResponse<Chat> = {
  success: true,
  data: chat,
  message: SUCCESS_MESSAGES.CHAT_CREATED,
};

const errorResponse: ApiResponse = {
  success: false,
  error: ERROR_MESSAGES.CHAT_NOT_FOUND,
};

console.log('Success response:', successResponse);
console.log('Error response:', errorResponse);

// ============================================================================
// 6. Form Validation with React Hook Form (Frontend example)
// ============================================================================

/*
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@whalli/utils';

function LoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = (data: LoginInput) => {
    console.log('Login:', data);
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('email')} />
      <input {...form.register('password')} type="password" />
      <button type="submit">Login</button>
    </form>
  );
}
*/

// ============================================================================
// 7. Backend Validation (NestJS example)
// ============================================================================

/*
import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { loginSchema, ERROR_MESSAGES } from '@whalli/utils';

@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() body: unknown) {
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_INPUT);
    }
    
    // Use validated data
    const { email, password } = result.data;
    // ... authenticate
  }
}
*/

export {};
