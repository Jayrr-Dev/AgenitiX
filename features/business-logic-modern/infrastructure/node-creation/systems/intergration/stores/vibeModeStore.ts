/**
 * VIBE MODE STORE - UI enhancement toggle state management
 *
 * • Manages vibe mode activation for enhanced visual experience
 * • Controls vibe handle visibility with opacity for debugging workflows
 * • Provides toggle functions for UI state changes
 * • Zustand store for reactive UI state management
 * • Coordinates visual debugging and development features
 *
 * Keywords: Zustand, vibe-mode, UI-state, toggle, debugging, vibe-handles
 */

import { create } from "zustand";
// import { persist } from 'zustand/middleware'; // TEMPORARILY DISABLED

interface VibeModeState {
  isVibeModeActive: boolean;
  showVibeHandles: boolean;
  vibeHandleOpacity: number; // Opacity level for vibe handles when "hidden"
  // _hasHydrated: boolean; // Not needed without persistence
  toggleVibeMode: () => void;
  enableVibeMode: () => void;
  disableVibeMode: () => void;
  toggleVibeHandles: () => void;
  showVibeHandlesAlways: () => void;
  hideVibeHandles: () => void;
  setVibeHandleOpacity: (opacity: number) => void;
  // setHasHydrated: (state: boolean) => void;
}

export const useVibeModeStore = create<VibeModeState>()((set) => ({
  isVibeModeActive: false,
  showVibeHandles: false, // Default to false so vibe mode is completely off at startup
  vibeHandleOpacity: 0.0001, // Practically invisible when "hidden" but still connectable
  // _hasHydrated: true, // Always hydrated in non-persistent mode

  // X Button - toggles BOTH Vibe Mode AND vibe handles together
  toggleVibeMode: () =>
    set((state) => ({
      isVibeModeActive: !state.isVibeModeActive,
      showVibeHandles: !state.isVibeModeActive, // When activating vibe mode, show vibe handles
    })),

  enableVibeMode: () => set({ isVibeModeActive: true, showVibeHandles: true }),

  disableVibeMode: () => set({ isVibeModeActive: false }),

  // VIBE HANDLE VISIBILITY CONTROLS
  toggleVibeHandles: () =>
    set((state) => ({
      showVibeHandles: !state.showVibeHandles,
    })),

  showVibeHandlesAlways: () => set({ showVibeHandles: true }),

  hideVibeHandles: () => set({ showVibeHandles: false }),

  // VIBE HANDLE OPACITY CONTROL
  setVibeHandleOpacity: (opacity: number) =>
    set({ vibeHandleOpacity: Math.max(0, Math.min(1, opacity)) }),

  // setHasHydrated: (state) => set({ _hasHydrated: state }),
}));
