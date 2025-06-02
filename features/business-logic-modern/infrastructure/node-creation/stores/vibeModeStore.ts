/**
 * VIBE MODE STORE - UI enhancement toggle state management
 *
 * • Manages vibe mode activation for enhanced visual experience
 * • Controls JSON handle visibility for debugging workflows
 * • Provides toggle functions for UI state changes
 * • Zustand store for reactive UI state management
 * • Coordinates visual debugging and development features
 *
 * Keywords: Zustand, vibe-mode, UI-state, toggle, debugging, JSON-handles
 */

import { create } from "zustand";
// import { persist } from 'zustand/middleware'; // TEMPORARILY DISABLED

interface VibeModeState {
  isVibeModeActive: boolean;
  showJsonHandles: boolean;
  // _hasHydrated: boolean; // Not needed without persistence
  toggleVibeMode: () => void;
  enableVibeMode: () => void;
  disableVibeMode: () => void;
  toggleJsonHandles: () => void;
  showJsonHandlesAlways: () => void;
  hideJsonHandles: () => void;
  // setHasHydrated: (state: boolean) => void;
}

export const useVibeModeStore = create<VibeModeState>()((set) => ({
  isVibeModeActive: false,
  showJsonHandles: false, // Default to false so vibe mode is completely off at startup
  // _hasHydrated: true, // Always hydrated in non-persistent mode

  // X Button - toggles BOTH Vibe Mode AND JSON handles together
  toggleVibeMode: () =>
    set((state) => ({
      isVibeModeActive: !state.isVibeModeActive,
      showJsonHandles: !state.isVibeModeActive, // When activating vibe mode, show JSON handles
    })),

  enableVibeMode: () => set({ isVibeModeActive: true, showJsonHandles: true }),

  disableVibeMode: () => set({ isVibeModeActive: false }),

  // JSON HANDLE VISIBILITY CONTROLS (separate from vibe mode)
  toggleJsonHandles: () =>
    set((state) => ({
      showJsonHandles: !state.showJsonHandles,
    })),

  showJsonHandlesAlways: () => set({ showJsonHandles: true }),

  hideJsonHandles: () => set({ showJsonHandles: false }),

  // setHasHydrated: (state) => set({ _hasHydrated: state }),
}));
