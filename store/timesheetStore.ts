// store/timesheetStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Define the type for a row in the data
export type DataRow = {
    active: boolean;
    firstName: string;
    lastName: string;
}

// Define the type for sorting direction
export type SortDirection = 'ascending' | 'descending';

// Define the type for sort configuration
export type SortConfig = {
    key: keyof DataRow | null;
    direction: SortDirection;
}

// Define the shape of our store
interface TimesheetStore {
    // Data state
    data: DataRow[];
    setData: (newData: DataRow[]) => void;
    
    // History for undo functionality
    history: DataRow[][];
    addToHistory: (state: DataRow[]) => void;
    clearHistory: () => void;
    
    // Redo history
    redoStack: DataRow[][];
    addToRedoStack: (state: DataRow[]) => void;
    clearRedoStack: () => void;
    
    // Sorting configuration
    sortConfig: SortConfig;
    setSortConfig: (config: SortConfig) => void;
    
    // Actions
    handleSort: (key: keyof DataRow) => void;
    handleUndo: () => void;
    handleRedo: () => void;
}

// Create the store with persistence
export const useTimesheetStore = create<TimesheetStore>()(
    persist(
        (set, get) => ({
            // Initial data
            data: [
                { active: true, firstName: 'Elon', lastName: 'Musk' },
                { active: false, firstName: 'Jeff', lastName: 'Bezos' },
            ],
            setData: (newData) => {
                // Clear redo stack when new data is set directly
                // (not through undo/redo operations)
                set({ 
                    data: newData,
                    redoStack: [] 
                });
            },
            
            // History for undo
            history: [],
            addToHistory: (state) => set((store) => ({ 
                history: [...store.history, state],
                // Clear redo stack when new history is added
                redoStack: []
            })),
            clearHistory: () => set({ history: [] }),
            
            // Redo stack
            redoStack: [],
            addToRedoStack: (state) => set((store) => ({ 
                redoStack: [...store.redoStack, state] 
            })),
            clearRedoStack: () => set({ redoStack: [] }),
            
            // Sorting configuration
            sortConfig: {
                key: null,
                direction: 'ascending'
            },
            setSortConfig: (config) => set({ sortConfig: config }),
            
            // Handle sorting action
            handleSort: (key) => {
                const { data, sortConfig } = get();
                let direction: SortDirection = 'ascending';
                
                // If already sorting by this key, toggle direction
                if (sortConfig.key === key && sortConfig.direction === 'ascending') {
                    direction = 'descending';
                }
                
                // Set new sort configuration
                set({ sortConfig: { key, direction } });
                
                // Add current state to history before sorting
                get().addToHistory([...data]);
                
                // Sort the data
                const sortedData = [...data].sort((a, b) => {
                    // Handle boolean values (for active column)
                    if (typeof a[key] === 'boolean') {
                        if (direction === 'ascending') {
                            return a[key] === b[key] ? 0 : a[key] ? -1 : 1;
                        } else {
                            return a[key] === b[key] ? 0 : a[key] ? 1 : -1;
                        }
                    }
                    
                    // Handle string values
                    if (direction === 'ascending') {
                        return a[key] > b[key] ? 1 : -1;
                    } else {
                        return a[key] < b[key] ? 1 : -1;
                    }
                });
                
                // Update the data and clear redo stack
                set({ 
                    data: sortedData,
                    redoStack: []
                });
            },
            
            // Handle undo action
            handleUndo: () => {
                const { history, data } = get();
                
                if (history.length > 0) {
                    // Get the last state from history
                    const previousState = history[history.length - 1];
                    
                    // Add current state to redo stack
                    get().addToRedoStack([...data]);
                    
                    // Update data to previous state
                    set({ data: previousState });
                    
                    // Remove the used state from history
                    set((store) => ({ 
                        history: store.history.slice(0, -1)
                    }));
                }
            },
            
            // Handle redo action
            handleRedo: () => {
                const { redoStack, data } = get();
                
                if (redoStack.length > 0) {
                    // Get the last state from redo stack
                    const nextState = redoStack[redoStack.length - 1];
                    
                    // Add current state to history
                    get().addToHistory([...data]);
                    
                    // Update data to next state
                    set({ data: nextState });
                    
                    // Remove the used state from redo stack
                    set((store) => ({ 
                        redoStack: store.redoStack.slice(0, -1)
                    }));
                }
            }
        }),
        {
            name: 'timesheet-storage', // unique name for localStorage
            partialize: (state) => ({ 
                data: state.data,
                sortConfig: state.sortConfig 
            }), // only persist these fields
        }
    )
);