/**
 * UI Store (Client State)
 * 
 * Manages UI-related client state such as:
 * - Sidebar state
 * - Modal states
 * - Theme preferences
 * - Toast notifications (if needed globally)
 * - Loading overlays
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Modal states (add more as needed)
  modals: {
    [key: string]: boolean;
  };
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  isModalOpen: (modalId: string) => boolean;
  
  // Theme (if not using next-themes)
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Loading overlay
  isLoading: boolean;
  loadingMessage?: string;
  setLoading: (isLoading: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Sidebar state
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      // Modal states
      modals: {},
      openModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: true },
        })),
      closeModal: (modalId) =>
        set((state) => {
          const newModals = { ...state.modals };
          delete newModals[modalId];
          return { modals: newModals };
        }),
      isModalOpen: (modalId) => {
        const state = get();
        return state.modals[modalId] === true;
      },
      
      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      // Loading overlay
      isLoading: false,
      loadingMessage: undefined,
      setLoading: (isLoading, message) =>
        set({
          isLoading,
          loadingMessage: message,
        }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist theme preference
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);

// Selector hooks for optimized re-renders
export const useSidebar = () => useUIStore((state) => ({
  isOpen: state.sidebarOpen,
  open: state.setSidebarOpen,
  close: () => state.setSidebarOpen(false),
  toggle: state.toggleSidebar,
}));

export const useModal = (modalId: string) => useUIStore((state) => ({
  isOpen: state.isModalOpen(modalId),
  open: () => state.openModal(modalId),
  close: () => state.closeModal(modalId),
}));

export const useTheme = () => useUIStore((state) => ({
  theme: state.theme,
  setTheme: state.setTheme,
}));

export const useLoading = () => useUIStore((state) => ({
  isLoading: state.isLoading,
  message: state.loadingMessage,
  setLoading: state.setLoading,
}));

