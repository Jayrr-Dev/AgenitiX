import { create } from 'zustand';

interface VibeModeState {
  isVibeModeActive: boolean;
  toggleVibeMode: () => void;
  enableVibeMode: () => void;
  disableVibeMode: () => void;
}

export const useVibeModeStore = create<VibeModeState>((set) => ({
  isVibeModeActive: false,
  
  toggleVibeMode: () => set((state) => ({ 
    isVibeModeActive: !state.isVibeModeActive 
  })),
  
  enableVibeMode: () => set({ isVibeModeActive: true }),
  
  disableVibeMode: () => set({ isVibeModeActive: false }),
})); 