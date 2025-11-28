import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * UI State interface for global UI preferences
 */
export interface UIState {
  /** Whether the desktop sidebar is collapsed */
  sidebarCollapsed: boolean;
  /** Whether the command palette modal is open */
  commandPaletteOpen: boolean;
  /** Current theme (dark only for now) */
  theme: 'dark' | 'light';
}

/**
 * UI Actions for state mutations
 */
export interface UIActions {
  /** Toggle sidebar collapsed state */
  toggleSidebar: () => void;
  /** Set sidebar collapsed state explicitly */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Toggle command palette open state */
  toggleCommandPalette: () => void;
  /** Set command palette open state explicitly */
  setCommandPaletteOpen: (open: boolean) => void;
  /** Set theme */
  setTheme: (theme: 'dark' | 'light') => void;
  /** Reset UI state to defaults */
  resetUI: () => void;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  theme: 'dark',
};

/**
 * Zustand store for UI state management
 *
 * Uses devtools for debugging and persist for localStorage persistence
 */
export const useUIStore = create<UIState & UIActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        toggleSidebar: () =>
          set(
            (state) => ({ sidebarCollapsed: !state.sidebarCollapsed }),
            undefined,
            'ui/toggleSidebar'
          ),

        setSidebarCollapsed: (collapsed) =>
          set({ sidebarCollapsed: collapsed }, undefined, 'ui/setSidebarCollapsed'),

        toggleCommandPalette: () =>
          set(
            (state) => ({ commandPaletteOpen: !state.commandPaletteOpen }),
            undefined,
            'ui/toggleCommandPalette'
          ),

        setCommandPaletteOpen: (open) =>
          set({ commandPaletteOpen: open }, undefined, 'ui/setCommandPaletteOpen'),

        setTheme: (theme) =>
          set({ theme }, undefined, 'ui/setTheme'),

        resetUI: () =>
          set(initialState, undefined, 'ui/resetUI'),
      }),
      {
        name: 'axon-ui-storage',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

/**
 * Selector hooks for common UI state access patterns
 */
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed);
export const useCommandPaletteOpen = () => useUIStore((state) => state.commandPaletteOpen);
export const useTheme = () => useUIStore((state) => state.theme);
