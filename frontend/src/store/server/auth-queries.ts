/**
 * Auth Queries (Server State)
 * 
 * React Query hooks for authentication-related API calls.
 * This handles all server state for authentication:
 * - Current user data
 * - Login mutations
 * - Register mutations
 * - Logout mutations
 * 
 * Client state (isAuthenticated, isInitialized) is managed in the auth store.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type User, type LoginRequest, type RegisterRequest } from '@/services/api';
import { queryKeys } from '../config/query-client';
import { useAuthStore } from '../client/auth-store';

/**
 * Query: Get current user
 * Fetches and caches the current authenticated user.
 * 
 * Note: Side effects (syncing to store) are handled in useAuth hook.
 */
export function useCurrentUser() {
  return useQuery<User>({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: async () => {
      const response = await api.getCurrentUser();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to get current user');
      }
      return response.data;
    },
    enabled: !!api.getToken(), // Only fetch if token exists
    retry: false, // Don't retry auth failures
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

/**
 * Mutation: Login
 * Authenticates user and updates all related state.
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await api.login(credentials);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }
      return response.data;
    },
    onSuccess: (data) => {
      const { user, token } = data;

      // Store tokens
      api.setToken(token);

      // Update client store
      setUser(user);

      // Invalidate and refetch current user query
      queryClient.setQueryData(queryKeys.auth.currentUser(), user);

      // Optionally: Invalidate other queries that depend on auth
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
    onError: (error) => {
      console.error('Login error:', error);
      // Error is handled by the component
    },
  });
}

/**
 * Mutation: Register
 * Registers a new user and automatically logs them in.
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await api.register(data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Registration failed');
      }
      return response.data;
    },
    onSuccess: (data) => {
      const { user, token } = data;

      // Store tokens
      api.setToken(token);

      // Update client store
      setUser(user);

      // Set query data for current user
      queryClient.setQueryData(queryKeys.auth.currentUser(), user);

      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
    onError: (error) => {
      console.error('Registration error:', error);
    },
  });
}

/**
 * Mutation: Logout
 * Logs out user and clears all auth-related state.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      try {
        await api.logout();
      } catch (error) {
        // Log error but continue with local cleanup
        console.error('Logout API error:', error);
      }
    },
    onSuccess: (data) => {
      // Clear tokens
      api.setToken(null);
      localStorage.removeItem('token');

      // Clear client store
      clearAuth();

      // Remove all auth query data
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });

      // Optionally: Clear all queries or specific ones
      // queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Still clear local state even if API fails
      clearAuth();
      api.setToken(null);
      localStorage.removeItem('token');
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

/**
 * Mutation: Refresh user data
 * Manually refreshes the current user data.
 */
export function useRefreshUser() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const response = await api.getCurrentUser();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to refresh user');
      }
      return response.data;
    },
    onSuccess: (user) => {
      // Update client store
      setUser(user);

      // Update query cache
      queryClient.setQueryData(queryKeys.auth.currentUser(), user);
    },
    onError: (error) => {
      console.error('Failed to refresh user:', error);
    },
  });
}

