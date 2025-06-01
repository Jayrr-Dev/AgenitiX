import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VibeModeState {
  isVibeModeActive: boolean;
  showJsonHandles: boolean;
  toggleVibeMode: () => void;
  enableVibeMode: () => void;
  disableVibeMode: () => void;
  toggleJsonHandles: () => void;
  showJsonHandlesAlways: () => void;
  hideJsonHandles: () => void;
}

export const useVibeModeStore = create<VibeModeState>()(
  persist(
    (set) => ({
      isVibeModeActive: false,
      showJsonHandles: true, // Default to true so JSON handles are visible
      
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
    }),
    {
      name: 'vibe-mode-storage', // localStorage key
      version: 1, // For future migrations
    }
  )
); 