//Period store for timesheet number 1 - 26 that persists on page reload
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface PeriodStore {
  period: number
  setPeriod: (period: number) => void
}

export const usePeriodStore = create<PeriodStore>()(
  persist(
    (set) => ({
      period: 1,
      setPeriod: (period: number) => set({ period }),
    }),
    {
      name: 'period-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

