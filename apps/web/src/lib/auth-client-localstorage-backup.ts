"use client";

/**
 * Authentication Client for NestJS + Passport.js API
 * Handles JWT-based authentication with email/password and OAuth
 */

import { useState, useEffect, useCallback } from "react";

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UseSessionReturn {
  data: User | null;
  isPending: boolean;
  error: Error | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

class AuthClient {
  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Sign up failed");
    }

    const data: AuthResponse = await response.json();
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Sign in failed");
    }

    const data: AuthResponse = await response.json();
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<{ user: User }> {
    const token = this.getAccessToken();

    if (!token) {
      throw new Error("No authentication token");
    }

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearTokens();
        throw new Error("Session expired");
      }
      if (response.status === 403) {
        throw new Error("Unauthorized");
      }
      try {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch profile");
      } catch (e) {
        throw new Error("Failed to fetch profile");
      }
    }

    return response.json();
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token");
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  /**
   * Sign out (client-side only, clears stored tokens)
   */
  signOut(): void {
    this.clearTokens();
  }

  /**
   * Get current session (user + token validity)
   */
  async getSession(): Promise<{ user: User | null }> {
    try {
      const token = this.getAccessToken();

      if (!token) {
        console.debug("[AuthClient] No token found");
        return { user: null };
      }

      console.debug("[AuthClient] Fetching profile with token");
      const profile = await this.getProfile();
      return { user: profile.user };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.debug("[AuthClient] getSession error:", errorMsg);
      
      // If token is invalid or expired, try to refresh ONCE
      if (errorMsg.includes("Session expired") || errorMsg.includes("Unauthorized")) {
        try {
          const refreshToken = this.getRefreshToken();
          if (!refreshToken) {
            console.debug("[AuthClient] No refresh token, clearing");
            this.clearTokens();
            return { user: null };
          }
          
          console.debug("[AuthClient] Attempting token refresh");
          await this.refreshToken();
          
          // Retry getting profile with new token (NOT recursive getSession)
          const newToken = this.getAccessToken();
          if (newToken) {
            console.debug("[AuthClient] Retrying profile fetch with new token");
            const profile = await this.getProfile();
            return { user: profile.user };
          }
          
          return { user: null };
        } catch (refreshError) {
          // Refresh failed, clear tokens and return null
          console.debug("[AuthClient] Refresh failed, clearing tokens");
          this.clearTokens();
          return { user: null };
        }
      }
      
      // For any other error, clear tokens and return null
      console.debug("[AuthClient] Unknown error, clearing tokens");
      this.clearTokens();
      return { user: null };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Store tokens in localStorage
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Clear tokens from localStorage
   */
  private clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader(): { Authorization?: string } {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Initiate Google OAuth flow
   */
  startGoogleAuth(): void {
    window.location.href = `${API_BASE_URL}/auth/google`;
  }

  /**
   * Initiate GitHub OAuth flow
   */
  startGitHubAuth(): void {
    window.location.href = `${API_BASE_URL}/auth/github`;
  }

  /**
   * Handle OAuth callback (extract tokens from URL/response)
   * Call this after OAuth redirect
   */
  async handleOAuthCallback(): Promise<AuthResponse | null> {
    // Get tokens from URL params if available
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    if (accessToken && refreshToken) {
      this.setTokens(accessToken, refreshToken);
      const profile = await this.getProfile();
      return {
        user: profile.user,
        accessToken,
        refreshToken,
      };
    }

    return null;
  }
}

// Create singleton instance
const authClientInstance = new AuthClient();

/**
 * Better Auth compatible sign up interface
 * Usage: signUp.email({ email, password, name })
 */
export const signUp = {
  email: async (params: { email: string; password: string; name?: string; callbackURL?: string }) => {
    const result = await authClientInstance.signUp(params.email, params.password, params.name);
    return result;
  },
};

/**
 * Better Auth compatible sign in interface
 * Usage: signIn.email({ email, password }) or signIn.social({ provider })
 */
export const signIn = {
  email: async (params: { email: string; password: string; callbackURL?: string }) => {
    const result = await authClientInstance.signIn(params.email, params.password);
    return result;
  },
  social: async (params: { provider: "google" | "github"; callbackURL?: string }) => {
    if (params.provider === "google") {
      authClientInstance.startGoogleAuth();
    } else if (params.provider === "github") {
      authClientInstance.startGitHubAuth();
    }
  },
};

/**
 * Better Auth compatible sign out
 */
export const signOut = async () => {
  authClientInstance.signOut();
};

/**
 * Better Auth compatible getSession
 */
export const getSession = async () => {
  return authClientInstance.getSession();
};

/**
 * Better Auth compatible getProfile
 */
export const getProfile = async () => {
  return authClientInstance.getProfile();
};

// Export singleton instance for direct usage
export const authClient = authClientInstance;

/**
 * React Hook: useSession
 * Returns current user session, loading state, and error
 * Compatible with Better Auth's useSession API
 */
export function useSession(): UseSessionReturn {
  const [data, setData] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isComponentMounted = true;

    const fetchSession = async () => {
      try {
        if (!isComponentMounted) return;
        setIsPending(true);
        
        console.debug("[useSession] Starting fetch...");
        const session = await authClient.getSession();
        console.debug("[useSession] Got session:", session);
        
        if (isComponentMounted) {
          setData(session.user);
          setError(null);
        }
      } catch (err) {
        // Silently handle errors - this is normal when user is not authenticated
        const errorMsg = err instanceof Error ? err.message : "Failed to fetch session";
        console.debug("[useSession] Error:", errorMsg);
        
        if (isComponentMounted && !errorMsg.includes("No authentication token") && !errorMsg.includes("Session expired")) {
          setError(err instanceof Error ? err : new Error(errorMsg));
        }
        if (isComponentMounted) {
          setData(null);
        }
      } finally {
        if (isComponentMounted) {
          console.debug("[useSession] Done loading");
          setIsPending(false);
        }
      }
    };

    // Start fetching immediately
    fetchSession();

    // Optional: Set up interval to refresh session periodically
    const interval = setInterval(fetchSession, 5 * 60 * 1000); // Every 5 minutes

    return () => {
      isComponentMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { data, isPending, error };
}

/**
 * React Hook: useAuth
 * Returns auth methods and current user
 */
export function useAuth() {
  const { data: user, isPending, error } = useSession();

  return {
    user,
    isAuthenticated: !!user,
    isPending,
    error,
    signUp: authClient.signUp.bind(authClient),
    signIn: authClient.signIn.bind(authClient),
    signOut: authClient.signOut.bind(authClient),
    getProfile: authClient.getProfile.bind(authClient),
    refreshToken: authClient.refreshToken.bind(authClient),
  };
}