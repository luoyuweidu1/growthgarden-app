import React, { createContext, useContext, useEffect, useState } from 'react';
import { setAuthToken, removeAuthToken, apiRequest } from '../lib/queryClient';

interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
  loginWithGoogle: () => void;
  loginWithGitHub: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in URL (OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setAuthToken(token);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check if user is already authenticated
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiRequest('GET', '/api/auth/me');
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        if (data.token) {
          setAuthToken(data.token); // Refresh token if provided
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      removeAuthToken();
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    // For now, redirect to OAuth (we didn't implement email/password)
    throw new Error('Email/password login not implemented. Please use Google or GitHub.');
  };

  const signUp = async (email: string, password: string, name?: string) => {
    // For now, redirect to OAuth (we didn't implement email/password)
    throw new Error('Email/password signup not implemented. Please use Google or GitHub.');
  };

  const signOut = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeAuthToken();
      setUser(null);
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    return localStorage.getItem('auth_token');
  };

  const loginWithGoogle = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const loginWithGitHub = () => {
    window.location.href = `${API_BASE_URL}/api/auth/github`;
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    getAuthToken,
    loginWithGoogle,
    loginWithGitHub,
  };

  return (
    <AuthContext.Provider value={value}>
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