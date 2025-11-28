/**
 * Client State Stores
 * 
 * Central export for all Zustand stores managing client-side state.
 * Client state includes:
 * - Auth state (user, authentication status)
 * - UI state (modals, sidebar, theme, loading)
 * - Preferences (user preferences, settings)
 * 
 * For server state (API data), see: ../server/
 */

export * from './auth-store';
export * from './ui-store';

