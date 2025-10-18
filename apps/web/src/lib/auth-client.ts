"use client";

/**
 * Authentication Client for NestJS + Passport.js API
 * Uses httpOnly cookies for secure token storage
 */

import { useState, useEffect } from "react";

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

class AuthClient {
  /**
   * Sign up with email and password
   * Tokens are automatically stored in httpOnly cookies by the server
   */
  async signUp(email: string, password: string, name?: string): Promise<{ user: User }> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Important: send/receive cookies
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Sign up failed");
    }

    return response.json();
  }

  /**
   * Sign in with email and password
   * Tokens are automatically stored in httpOnly cookies by the server
   */
  async signIn(email: string, password: string): Promise<{ user: User }> {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Important: send/receive cookies
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Sign in failed");
    }

    return response.json();
  }

  /**
   * Get current user profile
   * Token is automatically sent from httpOnly cookie
   */
  async getProfile(): Promise<{ user: User }> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      credentials: "include", // Important: send cookies
    });

    if (!response.ok) {
      if (response.status === 401) {
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
   * Refresh token is automatically sent from httpOnly cookie
   */
  async refreshToken(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // Important: send cookies
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    return response.json();
  }

  /**
   * Sign out - clears httpOnly cookies on server
   */
  async signOut(): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include", // Important: send cookies
    });
  }

  /**
   * Get current session (user + token validity)
   * Simplified: just call getProfile, server handles token refresh automatically
   */
  async getSession(): Promise<{ user: User | null }> {
    try {
      console.debug("[AuthClient] Fetching profile");
      const profile = await this.getProfile();
      return { user: profile.user };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.debug("[AuthClient] getSession error:", errorMsg);
      
      // If session expired, try to refresh once
      if (errorMsg.includes("Session expired") || errorMsg.includes("Unauthorized")) {
        try {
          console.debug("[AuthClient] Attempting token refresh");
          await this.refreshToken();
          
          // Retry getting profile with new token
          console.debug("[AuthClient] Retrying profile fetch with new token");
          const profile = await this.getProfile();
          return { user: profile.user };
        } catch (refreshError) {
          // Refresh failed, user needs to login
          console.debug("[AuthClient] Refresh failed");
          return { user: null };
        }
      }
      
      // For any other error, return null
      return { user: null };
    }
  }

  /**
   * Check if user is authenticated
   * Now calls getProfile to verify
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getProfile();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Start Google OAuth flow
   */
  startGoogleAuth(): void {
    window.location.href = `${API_BASE_URL}/auth/google`;
  }

  /**
   * Start GitHub OAuth flow
   */
  startGitHubAuth(): void {
    window.location.href = `${API_BASE_URL}/auth/github`;
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
  await authClientInstance.signOut();
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
        
        if (isComponentMounted && !errorMsg.includes("Session expired")) {
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

    // Optional: Set up interval to refresh session periodically (5 minutes)
    const interval = setInterval(fetchSession, 5 * 60 * 1000);

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
  };
}
