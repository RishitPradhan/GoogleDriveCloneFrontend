'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  storageUsed: string;
  storageLimit: string;
  fileCount?: number;
  folderCount?: number;
  createdAt: string;
  updatedAt: string;
  // Optional plan if backend returns it; otherwise we manage locally
  plan?: 'free' | 'pro' | 'business';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  // Upgrade plan
  plan: 'free' | 'pro' | 'business';
  upgradePlan: (newPlan: 'free' | 'pro' | 'business') => Promise<void>;
  googleSignIn: (idToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // start true; switch to false after checkAuth
  const [plan, setPlan] = useState<'free' | 'pro' | 'business'>('free');

  const isAuthenticated = !!user;

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response: any = await apiClient.getCurrentUser();
      if (response?.success && response.data?.user) {
        const serverUser: User = response.data.user;
        setUser(serverUser);
        // Hydrate plan from backend or per-user localStorage
        let storedPlan: 'free' | 'pro' | 'business' | null = null;
        if (typeof window !== 'undefined') {
          const perUserKey = `gd_plan_${serverUser.id}`;
          const legacy = localStorage.getItem('gd_plan') as 'free' | 'pro' | 'business' | null;
          const perUser = localStorage.getItem(perUserKey) as 'free' | 'pro' | 'business' | null;
          // Migrate legacy global key if present and no per-user value
          if (legacy && !perUser) {
            localStorage.setItem(perUserKey, legacy);
            try { localStorage.removeItem('gd_plan'); } catch {}
            storedPlan = legacy;
          } else {
            storedPlan = perUser;
          }
        }
        const effectivePlan = (serverUser.plan as any) || storedPlan || 'free';
        setPlan(effectivePlan);
        // If backend doesn't manage storage limits by plan, adjust locally
        if (!serverUser.plan) {
          const updated = applyPlanStorage(serverUser, effectivePlan);
          setUser(updated);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const googleSignIn = async (idToken: string) => {
    const response: any = await apiClient.googleSignIn(idToken);
    if (response?.success) {
      const u: User = response.data.user;
      setUser(u);
      // Apply per-user stored plan or default to free
      if (typeof window !== 'undefined') {
        const perUserKey = `gd_plan_${u.id}`;
        const stored = (localStorage.getItem(perUserKey) as 'free' | 'pro' | 'business' | null) || 'free';
        setPlan(stored);
        const updated = applyPlanStorage(u, stored);
        setUser(updated);
      } else {
        setPlan('free');
      }
    } else {
      throw new Error(response?.error?.message || 'Google sign-in failed');
    }
  };

  const login = async (email: string, password: string) => {
    const response: any = await apiClient.login({ email, password });
    if (response?.success) {
      const u: User = response.data.user;
      setUser(u);
      // Apply per-user stored plan or default to free
      if (typeof window !== 'undefined') {
        const perUserKey = `gd_plan_${u.id}`;
        const stored = (localStorage.getItem(perUserKey) as 'free' | 'pro' | 'business' | null) || 'free';
        setPlan(stored);
        const updated = applyPlanStorage(u, stored);
        setUser(updated);
      } else {
        setPlan('free');
      }
      // Backend sets HTTP-only cookies; no need to set client cookie
    } else {
      throw new Error(response?.error?.message || 'Login failed');
    }
  };

  const register = async (data: { email: string; username: string; password: string; firstName?: string; lastName?: string }) => {
    // Backend expects { email, password, name }
    const response: any = await apiClient.register({
      email: data.email,
      password: data.password,
      name: data.username,
    });
    if (response?.success) {
      const u: User = response.data.user;
      setUser(u);
      // New accounts start as 'free' unless per-user storage indicates otherwise
      setPlan('free');
      if (typeof window !== 'undefined') {
        const perUserKey = `gd_plan_${u.id}`;
        localStorage.setItem(perUserKey, 'free');
      }
      const updated = applyPlanStorage(u, 'free');
      setUser(updated);
    } else {
      throw new Error(response?.error?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } finally {
      setUser(null);
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      setPlan('free');
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  // Map plans to storage limits (demo)
  const applyPlanStorage = (u: User, p: 'free' | 'pro' | 'business'): User => {
    const limits: Record<typeof p, string> = {
      free: '15',
      pro: '200',
      business: '2000',
    };
    return { ...u, storageLimit: limits[p], plan: p };
  };

  // Demo upgrade: persist plan locally and bump storageLimit
  const upgradePlan = async (newPlan: 'free' | 'pro' | 'business') => {
    setPlan(newPlan);
    if (user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`gd_plan_${user.id}`, newPlan);
      }
      const updated = applyPlanStorage(user, newPlan);
      setUser(updated);
    }
  };

  const refreshUser = async () => {
    try {
      const response: any = await apiClient.getCurrentUser();
      if (response?.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  // Restore session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    plan,
    upgradePlan,
    googleSignIn,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
