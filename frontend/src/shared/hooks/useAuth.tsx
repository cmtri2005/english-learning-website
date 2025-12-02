/**
 * Auth Hook (Backward Compatibility)
 * 
 * This hook provides a unified interface for authentication that combines:
 * - Client state (Zustand store) - for auth status, user data
 * - Server state (React Query) - for API calls
 * 
 * This maintains backward compatibility with the old Context API-based auth.
 * Components can still use this hook in the same way.
 * 
 * Note: The old AuthProvider context is no longer needed.
 * This hook replaces it entirely.
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/store/client/auth-store';
import {
  useCurrentUser,
  useLogin as useLoginMutation,
  useRegister as useRegisterMutation,
  useLogout as useLogoutMutation,
  useRefreshUser as useRefreshUserMutation,
} from '@/store/server/auth-queries';
import type { LoginRequest, RegisterRequest } from '@/services/api';

/**
 * Unified Auth Hook
 * 
 * Provides a complete authentication interface combining:
 * - User data (from client store, synced with React Query)
 * - Loading states (from React Query)
 * - Auth actions (login, register, logout, refresh)
 * 
 * @example
 * ```tsx
 * const { user, isLoggedIn, isLoading, login, logout } = useAuth();
 * ```
 */
export function useAuth() {
  // Get client state from Zustand store
  const { user, isAuthenticated, isInitialized, setUser, clearAuth, initialize } = useAuthStore();
  
  // Get server state from React Query
  const {
    data: currentUser,
    isLoading: isLoadingUser,
    isFetching: isFetchingUser,
    error: userError,
    refetch: refetchUser,
  } = useCurrentUser();
  
  // Mutations
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();
  const refreshUserMutation = useRefreshUserMutation();
  
  // Sync React Query user data to Zustand store
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      if (!isInitialized) {
        initialize();
      }
    }
  }, [currentUser, setUser, isInitialized, initialize]);
  
  // Handle auth errors and initialize
  useEffect(() => {
    if (!isInitialized && !isLoadingUser) {
      if (userError) {
        // Clear auth on error
        clearAuth();
      }
      initialize();
    }
  }, [isInitialized, isLoadingUser, userError, clearAuth, initialize]);
  
  // Auth actions
  const login = async (credentials: LoginRequest) => {
    await loginMutation.mutateAsync(credentials);
  };
  
  const register = async (data: RegisterRequest) => {
    await registerMutation.mutateAsync(data);
  };
  
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  const refreshUser = async () => {
    await refreshUserMutation.mutateAsync();
  };
  
  // Combined loading state
  const isLoading = isLoadingUser || !isInitialized;
  const isLoggingIn = loginMutation.isPending;
  const isRegistering = registerMutation.isPending;
  const isLoggingOut = logoutMutation.isPending;
  
  // Error states
  const loginError = loginMutation.error;
  const registerError = registerMutation.error;
  const authError = userError;
  
  return {
    // User data (from client store, synced with React Query)
    user: user || currentUser || null,
    isLoggedIn: isAuthenticated || !!currentUser,
    isAuthenticated: isAuthenticated || !!currentUser,
    
    // Loading states
    isLoading,
    isInitialized,
    isFetchingUser,
    isLoggingIn,
    isRegistering,
    isLoggingOut,
    
    // Error states
    error: authError || loginError || registerError,
    loginError,
    registerError,
    authError,
    
    // Auth actions
    login,
    register,
    logout,
    refreshUser,
    refetchUser,
    
    // Direct access to mutations (for advanced usage)
    mutations: {
      login: loginMutation,
      register: registerMutation,
      logout: logoutMutation,
      refreshUser: refreshUserMutation,
    },
  };
}

// Export types for TypeScript
export type UseAuthReturn = ReturnType<typeof useAuth>;
