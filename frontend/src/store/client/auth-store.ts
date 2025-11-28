/**
 * Auth Store (Client State)
 * 
 * Manages authentication client state using Zustand.
 * This store handles:
 * - Current user data (synced with React Query)
 * - Auth loading states
 * - Auth actions (login, register, logout)
 * 
 * Note: Server state (API calls) is managed via React Query hooks.
 * This store only manages client-side auth state.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, LoginRequest, RegisterRequest } from '@/services/http/api';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  clearAuth: () => void;
  initialize: () => void;
  setInitialized: (value: boolean) => void;
}

/**
 * Auth Store
 * 
 * Stores minimal client state for authentication.
 * User data is synced from React Query's server state.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      
      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
      
      clearAuth: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
      
      initialize: () =>
        set({
          isInitialized: true,
        }),
      
      setInitialized: (value) =>
        set({
          isInitialized: value,
        }),
    }),
    {
      name: 'auth-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist user data, not loading states
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Note: The main useAuth hook is exported from @/shared/hooks/useAuth
// This selector hook is for direct store access only

// Renamed to avoid conflict with server queries
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAuthInitialized = () => useAuthStore((state) => state.isInitialized);

