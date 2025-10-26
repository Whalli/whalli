/**
 * API Client
 * 
 * Type-safe API client for calling backend JSON endpoints.
 * Uses NEXT_PUBLIC_API_URL from environment variables.
 * NO direct Prisma usage - all data comes from REST API.
 */

import type { UserSafe, Chat, Message, Preset } from '@whalli/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================================================
// Types
// ============================================================================

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface AuthResponse {
  user: UserSafe;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateChatDto {
  title: string;
  model: string;
  presetId?: string;
}

export interface UpdateChatDto {
  title?: string;
  model?: string;
}

export interface CreateMessageDto {
  content: string;
}

export interface MessageResponse {
  userMessage: Message;
  assistantMessage: Message;
}

export interface CreatePresetDto {
  name: string;
  color: string;
  systemInstruction: string;
}

export interface UpdatePresetDto {
  name?: string;
  color?: string;
  systemInstruction?: string;
}

// ============================================================================
// API Client Class
// ============================================================================

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    
    // Load token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken');
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
    
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add custom headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    // Add authorization header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Parse response body
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error: ApiError = {
          message: data?.message || 'An error occurred',
          statusCode: response.status,
          error: data?.error,
        };
        throw error;
      }

      return data as T;
    } catch (error) {
      if ((error as ApiError).statusCode) {
        throw error;
      }
      
      // Network error
      throw {
        message: 'Network error. Please check your connection.',
        statusCode: 0,
      } as ApiError;
    }
  }

  // ==========================================================================
  // Authentication
  // ==========================================================================

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    
    this.setToken(response.accessToken);
    return response;
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    
    this.setToken(response.accessToken);
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async getMe(): Promise<UserSafe> {
    return this.request<UserSafe>('/auth/me');
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    
    this.setToken(response.accessToken);
    return response;
  }

  // ==========================================================================
  // Chats
  // ==========================================================================

  async getChats(): Promise<Chat[]> {
    return this.request<Chat[]>('/chat');
  }

  async getChat(id: string): Promise<Chat> {
    return this.request<Chat>(`/chat/${id}`);
  }

  async createChat(dto: CreateChatDto): Promise<Chat> {
    return this.request<Chat>('/chat', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateChat(id: string, dto: UpdateChatDto): Promise<Chat> {
    return this.request<Chat>(`/chat/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async deleteChat(id: string): Promise<void> {
    return this.request<void>(`/chat/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================================================
  // Messages
  // ==========================================================================

  async getMessages(chatId: string): Promise<Message[]> {
    return this.request<Message[]>(`/chat/${chatId}/messages`);
  }

  async sendMessage(
    chatId: string,
    dto: CreateMessageDto
  ): Promise<MessageResponse> {
    return this.request<MessageResponse>(`/chat/${chatId}/message`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  // ==========================================================================
  // Presets
  // ==========================================================================

  async getPresets(): Promise<Preset[]> {
    return this.request<Preset[]>('/presets');
  }

  async getPreset(id: string): Promise<Preset> {
    return this.request<Preset>(`/presets/${id}`);
  }

  async createPreset(dto: CreatePresetDto): Promise<Preset> {
    return this.request<Preset>('/presets', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updatePreset(id: string, dto: UpdatePresetDto): Promise<Preset> {
    return this.request<Preset>(`/presets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async deletePreset(id: string): Promise<void> {
    return this.request<void>(`/presets/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================================================
  // Health
  // ==========================================================================

  async health(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const api = new ApiClient(API_URL);

// ============================================================================
// Helper: Check if user is authenticated
// ============================================================================

export function isAuthenticated(): boolean {
  return api.getToken() !== null;
}
