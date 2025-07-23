//Period store for timesheet number 1 - 26 that persists on page reload
import superjson from "superjson";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface PeriodStore {
	period: number;
	setPeriod: (period: number) => void;
}

export const usePeriodStore = create<PeriodStore>()(
	persist(
		(set) => ({
			period: 1,
			setPeriod: (period: number) => set({ period }),
		}),
		{
			name: "period-storage",
			storage: createJSONStorage(() => ({
				getItem: (name) => {
					const item = localStorage.getItem(name);
					return item ? superjson.parse(item) : null;
				},
				setItem: (name, value) => {
					localStorage.setItem(name, superjson.stringify(value));
				},
				removeItem: (name) => localStorage.removeItem(name),
			})),
		}
	)
);
