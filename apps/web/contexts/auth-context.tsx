'use client';

/**
 * Auth Context
 * 
 * Manages authentication state across the application.
 * Provides login, logout, and user information.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, type LoginDto, type RegisterDto } from '@/lib/api-client';
import type { UserSafe } from '@whalli/utils';

interface AuthContextType {
  user: UserSafe | null;
  loading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSafe | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (api.getToken()) {
          const userData = await api.getMe();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        api.setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (dto: LoginDto) => {
    const response = await api.login(dto);
    setUser(response.user);
  };

  const register = async (dto: RegisterDto) => {
    const response = await api.register(dto);
    setUser(response.user);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
