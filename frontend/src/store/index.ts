/**
 * State Management - Central Export
 * 
 * This is the main entry point for all state management in the application.
 * 
 * Structure:
 * - Client State (Zustand stores): ./client/
 *   - Auth state, UI state, preferences
 * - Server State (React Query): ./server/
 *   - API queries and mutations
 * - Configuration: ./config/
 *   - QueryClient config, query keys
 * 
 * @example
 * ```tsx
 * // Client state
 * import { useAuthStore, useUIStore } from '@/store';
 * 
 * // Server state
 * import { useCurrentUser, useLogin } from '@/store/server';
 * 
 * // Or use unified hooks
 * import { useAuth } from '@/shared/hooks/useAuth';
 * ```
 */

// Client state stores (export selectors only to avoid conflicts)
export {
  useAuthStore,
  useAuthUser,
  useIsAuthenticated,
  useIsAuthInitialized,
  useUIStore,
  useSidebar,
  useModal,
  useTheme,
  useLoading,
} from './client';

// Server state queries (exported individually for clarity)
export * from './server';

// Configuration
export { queryClient, queryKeys } from './config/query-client';

