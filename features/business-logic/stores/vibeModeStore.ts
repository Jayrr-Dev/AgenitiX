import { create } from 'zustand';
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
  showJsonHandles: true, // Default to true so JSON handles are visible
  // _hasHydrated: true, // Always hydrated in non-persistent mode
  
  // X Button - toggles BOTH Vibe Mode AND JSON handles together
  toggleVibeMode: () => set((state) => ({ 
    isVibeModeActive: !state.isVibeModeActive,
    showJsonHandles: !state.isVibeModeActive // When activating vibe mode, show JSON handles
  })),
  
  enableVibeMode: () => set({ isVibeModeActive: true, showJsonHandles: true }),
  
  disableVibeMode: () => set({ isVibeModeActive: false }),
  
  // JSON HANDLE VISIBILITY CONTROLS (separate from vibe mode)
  toggleJsonHandles: () => set((state) => ({ 
    showJsonHandles: !state.showJsonHandles 
  })),
  
  showJsonHandlesAlways: () => set({ showJsonHandles: true }),
  
  hideJsonHandles: () => set({ showJsonHandles: false }),
  
  // setHasHydrated: (state) => set({ _hasHydrated: state }),
})); 