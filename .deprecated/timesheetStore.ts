// store/timesheetStore.ts
import superjson from "superjson";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Updated DataRow type to match your data structure
export type DataRow = {
	id: number;
	status: boolean;
	entryDate: string; // String type for date
	project: string;
	projectId: number;
	workOrder: string;
	description: string;
	regularTime: number;
	overtimeTime: number;
	holidayTime: number;
	vacationTime: number;
	bankTime: number;
	sickLeaveTime: number;
	km: number;
	workPerformed: string;
	type: string;
	task: number;
	isNew?: boolean; // Flag to identify newly created rows that haven't been saved yet
	isSynced?: boolean; // Flag to identify rows that are synced with the server
};

// SortConfig type
type SortConfig = {
	key: string;
	direction: "ascending" | "descending";
};

type UpdateData = {
	id: number;
	updatedRow: Partial<DataRow>;
};

// Store type
type TimesheetStore = {
	data: DataRow[];
	setData: (data: DataRow[]) => void;
	upsertData: (data: DataRow[]) => void;
	updateData: (data: UpdateData[]) => void;
	addRow: (row: DataRow) => void;
	updateRow: (id: number, updatedRow: Partial<DataRow>) => void;
	deleteRow: (id: number) => void;
	markRowAsSynced: (clientId: number, serverId: number) => void;
	history: DataRow[][];
	addToHistory: (prevData: DataRow[]) => void;
	redoStack: DataRow[][];
	clearRedoStack: () => void;
	sortConfig: SortConfig;
	handleSort: (key: string) => void;
	handleUndo: () => void;
	handleRedo: () => void;
	resetStore: () => void;
	lastSavedData: DataRow[]; // Store the last saved state for comparison
	setLastSavedData: (data: DataRow[]) => void;
	currentPeriod: number; // Store the current pay period
	setCurrentPeriod: (period: number) => void;
};

// Create the store with persistence middleware
export const useTimesheetStore = create<TimesheetStore>()(
	persist(
		(set, get) => ({
			// Initial empty data array
			data: [],

			// Last saved data for comparison
			lastSavedData: [],
			setLastSavedData: (data) => set({ lastSavedData: data }),

			// Current period
			currentPeriod: 1,
			setCurrentPeriod: (period) => set({ currentPeriod: period }),

			// Reset store function
			resetStore: () =>
				set({
					data: [],
					history: [],
					redoStack: [],
					sortConfig: { key: "", direction: "ascending" },
					lastSavedData: [],
				}),

			// Set data function
			setData: (data) => set({ data }),

			//upsert data function merge data with existing data. If the id is already in the data, update the row. If the id is not in the data, add the row.
			upsertData: (newData: DataRow[]) =>
				set((state) => {
					// Create a Map from the existing data for efficient lookups (O(n))
					// Use the 'id' as the key and the row object as the value.
					const dataMap = new Map<DataRow["id"], DataRow>(
						state.data.map((item) => [item.id, item])
					);

					// Iterate through the new data (O(m))
					// For each item, update the Map. If the id already exists,
					// map.set() updates the value; otherwise, it adds a new entry.
					newData.forEach((item) => {
						dataMap.set(item.id, item);
					});

					// Convert the values of the Map back into an array
					// The order might change compared to the original state.data,
					// but it will contain the correctly upserted items.
					const mergedData = Array.from(dataMap.values());

					// Return the updated state
					return { data: mergedData };
				}),

			//update data function
			updateData: (data: UpdateData[]) =>
				set((state) => ({
					data: state.data.map((row) =>
						data.some((update) => update.id === row.id)
							? {
									...row,
									...data.find((update) => update.id === row.id)?.updatedRow,
								}
							: row
					),
				})),

			// Add a new row
			addRow: (row) =>
				set((state) => ({
					data: [...state.data, { ...row, isNew: true, isSynced: false }],
				})),

			// Update a row
			updateRow: (id, updatedRow) =>
				set((state) => ({
					data: state.data.map((row) =>
						row.id === id ? { ...row, ...updatedRow, isSynced: false } : row
					),
				})),

			// Delete a row
			deleteRow: (id) =>
				set((state) => ({
					data: state.data.filter((row) => row.id !== id),
				})),

			// Mark a row as synced with the server and update its ID if needed
			markRowAsSynced: (clientId, serverId) =>
				set((state) => ({
					data: state.data.map((row) =>
						row.id === clientId ? { ...row, id: serverId, isNew: false, isSynced: true } : row
					),
				})),

			// Undo/redo history
			history: [],
			addToHistory: (prevData) =>
				set((state) => ({
					history: [...state.history, prevData],
					// Clear redo stack when a new action is performed
					redoStack: [],
				})),

			// Redo stack
			redoStack: [],
			clearRedoStack: () => set({ redoStack: [] }),

			// Sorting
			sortConfig: { key: "", direction: "ascending" },
			handleSort: (key) =>
				set((state) => {
					// Determine the sorting direction
					const direction =
						state.sortConfig.key === key && state.sortConfig.direction === "ascending"
							? "descending"
							: "ascending";

					// Save current state to history before sorting
					const prevData = [...state.data];

					// Sort the data
					const sortedData = [...state.data].sort((a, b) => {
						// Get values for the specified key
						const valueA = a[key as keyof DataRow];
						const valueB = b[key as keyof DataRow];

						// Handle different types of values
						if (typeof valueA === "boolean" && typeof valueB === "boolean") {
							return direction === "ascending"
								? Number(valueA) - Number(valueB)
								: Number(valueB) - Number(valueA);
						}

						if (typeof valueA === "number" && typeof valueB === "number") {
							return direction === "ascending" ? valueA - valueB : valueB - valueA;
						}

						// Default string comparison
						const strA = String(valueA).toLowerCase();
						const strB = String(valueB).toLowerCase();

						return direction === "ascending" ? strA.localeCompare(strB) : strB.localeCompare(strA);
					});

					// Add current state to history before modifying
					state.addToHistory(prevData);

					return {
						data: sortedData,
						sortConfig: { key, direction },
					};
				}),

			// Undo function
			handleUndo: () =>
				set((state) => {
					if (state.history.length === 0) return state;

					// Get the last state from history
					const prevData = state.history[state.history.length - 1];

					// Add current state to redo stack
					const redoStack = [...state.redoStack, state.data];

					// Remove the last item from history
					const history = state.history.slice(0, -1);

					return {
						data: prevData,
						history,
						redoStack,
					};
				}),

			// Redo function
			handleRedo: () =>
				set((state) => {
					if (state.redoStack.length === 0) return state;

					// Get the last state from redoStack
					const nextData = state.redoStack[state.redoStack.length - 1];

					// Add current state to history
					const history = [...state.history, state.data];

					// Remove the last item from redoStack
					const redoStack = state.redoStack.slice(0, -1);

					return {
						data: nextData,
						history,
						redoStack,
					};
				}),
		}),
		{
			name: "timesheet-storage", // unique name for localStorage key
			storage: createJSONStorage(() => ({
				getItem: (name) => {
					const item = localStorage.getItem(name);
					return item ? superjson.parse(item) : null;
				},
				setItem: (name, value) => {
					localStorage.setItem(name, superjson.stringify(value));
				},
				removeItem: (name) => localStorage.removeItem(name),
			})), // Enhanced with superjson for Date, Map, Set support
			partialize: (state) => ({
				// Only persist the essential data
				data: state.data,
				sortConfig: state.sortConfig,
				lastSavedData: state.lastSavedData,
				currentPeriod: state.currentPeriod,
			}),
			// This function runs when the stored data is rehydrated
			onRehydrateStorage: () => (state) => {
				if (state) {
					console.log("Timesheet store hydrated from localStorage");
				}
			},
		}
	)
);
