/**
 * Server State Queries
 * 
 * Central export for all React Query hooks managing server-side state.
 * Server state includes:
 * - API data (users, courses, forum posts, etc.)
 * - Server state mutations (create, update, delete)
 * 
 * For client state (UI, auth status), see: ../client/
 */

export * from './auth-queries';
export * from './user-queries';
export * from './blog-queries';

