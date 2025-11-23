# 📦 State Management

This directory contains all state management code for the application.

## Structure

```
store/
├── client/              # Client state (Zustand stores)
│   ├── auth-store.ts   # Authentication state
│   ├── ui-store.ts     # UI state (modals, sidebar, theme)
│   └── index.ts
├── server/              # Server state (React Query hooks)
│   ├── auth-queries.ts # Auth API queries/mutations
│   ├── user-queries.ts # User API queries/mutations
│   └── index.ts
├── config/              # Configuration
│   └── query-client.ts  # React Query configuration
└── index.ts             # Central export
```

## Quick Start

### Client State (Zustand)

```tsx
import { useAuthStore, useUIStore } from '@/store';

// Auth
const { user, isAuthenticated } = useAuthStore();

// UI
const { sidebarOpen, setSidebarOpen } = useUIStore();
```

### Server State (React Query)

```tsx
import { useCurrentUser, useLogin } from '@/store/server';

// Query
const { data: user, isLoading } = useCurrentUser();

// Mutation
const loginMutation = useLogin();
await loginMutation.mutateAsync({ email, password });
```

### Unified Hook (Recommended)

```tsx
import { useAuth } from '@/shared/hooks/useAuth';

const { user, isLoggedIn, login, logout, isLoading } = useAuth();
```

## Documentation

See **[../STATE_MANAGEMENT.md](../STATE_MANAGEMENT.md)** for complete documentation.

