/**
 * User Queries (Server State)
 * 
 * React Query hooks for user-related API calls.
 * This handles all server state for users:
 * - Fetching user lists
 * - Fetching individual users
 * - User mutations (update, delete, etc.)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type User } from '@/services/api';
import { queryKeys } from '../config/query-client';

/**
 * Query: Get all users
 * Fetches and caches a list of users (admin/teacher only).
 */
export function useUsers(filters?: Record<string, unknown>) {
  return useQuery<User[]>({
    queryKey: queryKeys.users.list(filters),
    queryFn: async () => {
      const response = await api.getUsers();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to get users');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

/**
 * Query: Get user by ID
 * Fetches and caches a single user by ID.
 */
export function useUser(userId: number) {
  return useQuery<User>({
    queryKey: queryKeys.users.detail(userId),
    queryFn: async () => {
      const response = await api.getUser(userId);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to get user');
      }
      return response.data;
    },
    enabled: !!userId, // Only fetch if userId is provided
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

// Note: Add more user-related mutations here as needed
// Example: useUpdateUser(), useDeleteUser(), etc.

