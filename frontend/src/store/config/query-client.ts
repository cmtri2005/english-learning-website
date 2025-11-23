/**
 * React Query Configuration
 * 
 * This file configures TanStack Query (React Query) with default options
 * for server state management across the application.
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

// Default options for all queries and mutations
const defaultOptions: DefaultOptions = {
  queries: {
    // Retry failed requests 3 times with exponential backoff
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Cache data for 5 minutes by default
    staleTime: 5 * 60 * 1000,
    
    // Keep unused/inactive cache for 10 minutes
    gcTime: 10 * 60 * 1000,
    
    // Refetch on window focus in development, but not in production
    refetchOnWindowFocus: import.meta.env.DEV,
    
    // Don't refetch on reconnect automatically
    refetchOnReconnect: false,
    
    // Don't refetch on mount if data is fresh
    refetchOnMount: true,
  },
  mutations: {
    // Retry failed mutations once
    retry: 1,
    
    // Show error notifications globally (you can customize this)
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  },
};

// Create and configure the QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions,
});

// Query key factory functions for consistent key management
export const queryKeys = {
  // Auth queries
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
  },
  
  // User queries
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
  },
  
  // Course queries (for future use)
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.courses.lists(), filters] as const,
    details: () => [...queryKeys.courses.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.courses.details(), id] as const,
  },
  
  // Add more query key factories as needed
} as const;

