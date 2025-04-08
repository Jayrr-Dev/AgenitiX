"use client"
import {
    DataSheetGrid,
    checkboxColumn,
    textColumn,
    keyColumn,
} from 'react-datasheet-grid'
import { useEffect, useRef } from 'react'
import 'react-datasheet-grid/dist/style.css'
import { useTimesheetStore, type DataRow } from '@/store/timesheetStore' // Import our store
import { usePeriodStore } from '@/store/periodStore'
import { getTimesheetEntries } from '@/utils/supabaseUtils'
import { createClient } from '@/utils/supabase/client'
import { useMemo } from 'react'

type EmployeeData = {
    id: string;
    name: string;
    name_code: string;
    title: string;
    email: string;
}

export default function Timesheet({ employeeData, authID }: { employeeData: EmployeeData[], authID: string }) {
    //Variables
    const { period, setPeriod } = usePeriodStore();

    //Get timesheet entries from supabase for the current period
    const supabase = createClient();
    const timesheetEntries = useMemo(() => {
        const fetchTimesheetEntries = async () => {
            const { data: timesheetEntries, error } = await supabase
                .from('timesheet_entries')
                .select('*')
                .eq('authID', authID)
                .eq('pay_period', period);
            if (error) {
                console.error('Error fetching timesheet entries:', error);
            }
            return timesheetEntries;
        }
        return fetchTimesheetEntries();
    }, [period, authID]);

    console.log(timesheetEntries);

    // Use our Zustand store
    const {
        data,
        setData,
        history,
        addToHistory,
        redoStack,
        sortConfig,
        handleSort,
        handleUndo,
        handleRedo
    } = useTimesheetStore();
    
    // Debounce timer ref with number type
    const debounceTimerRef = useRef<number | null>(null);
    
    // Previous data ref to compare for actual changes
    const prevDataRef = useRef<string>(JSON.stringify(data));
    
    // Clean up the timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current !== null) {
                window.clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);
    
    // Add keyboard event listeners for Ctrl+Z (undo) and Ctrl+Y (redo)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check for Ctrl+Z (Windows/Linux) or Command+Z (Mac) for Undo
            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                // Prevent the default browser undo behavior
                event.preventDefault();
                handleUndo();
            }
            
            // Check for Ctrl+Y (Windows/Linux) or Command+Y (Mac) for Redo
            if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
                // Prevent the default browser redo behavior
                event.preventDefault();
                handleRedo();
            }
        }

        // Add event listener
        window.addEventListener('keydown', handleKeyDown);
        
        // Clean up event listener on component unmount
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        }
    }, [handleUndo, handleRedo]); // Re-add listener when handlers change
    
    // Function to get sort direction indicator
    const getSortDirectionIndicator = (key: keyof DataRow) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    };

    const columns = [
        { 
            ...keyColumn('active', checkboxColumn), 
            title: 'Active' 
        },
        { 
            ...keyColumn('firstName', textColumn), 
            title: 'First name' 
        },
        { 
            ...keyColumn('lastName', textColumn), 
            title: 'Last name' 
        },
    ]

    // Function to create a new empty row
    const createEmptyRow = (): DataRow => ({
        active: false,
        firstName: '',
        lastName: ''
    });

    // Function to handle grid changes with debouncing
    const handleGridChange = (value: any) => {
        // Clear any existing timer
        if (debounceTimerRef.current !== null) {
            window.clearTimeout(debounceTimerRef.current);
        }
        
        // Set data immediately without updating history
        setData(value as DataRow[]);
        
        // Wait for 500ms of inactivity before adding to history
        debounceTimerRef.current = window.setTimeout(() => {
            // Only add to history if there's an actual change
            const newDataStr = JSON.stringify(value);
            
            if (newDataStr !== prevDataRef.current) {
                // Add previous state to history
                addToHistory(JSON.parse(prevDataRef.current));
                // Update previous data ref
                prevDataRef.current = newDataStr;
            }
            
            debounceTimerRef.current = null;
        }, 500);
    };

    return (
        <div>
            <h1>Timesheet</h1>
            {/* Employee Inputbox for period works on mobile */}
            <div className='flex flex-row gap-2'>
                <span className='font-bold'>Period:</span>
                    <input className='border-2 border-gray-300 rounded-md p-0  text-center h-6 w-12' type="number" min={1} max={26} value={period} onChange={(e) => setPeriod(parseInt(e.target.value))} />   
            </div>
            {/* Employee Data */}
            <div><span className='font-bold'>Id:</span> {employeeData[0].id}</div>
            <div><span className='font-bold'>Name:</span> {employeeData[0].name}</div>
            <div><span className='font-bold'>Title:</span> {employeeData[0].title}</div>
            {/* <div><span className='font-bold'>Email:</span> {employeeData[0].email}</div> */}
            
            {/* Sorting, Undo, and Redo Controls */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <span style={{ marginRight: '0.5rem' }}>Sort by:</span>
                    <button 
                        onClick={() => handleSort('active')}
                        style={{ marginRight: '0.5rem' }}
                    >
                        Active{getSortDirectionIndicator('active')}
                    </button>
                    <button 
                        onClick={() => handleSort('firstName')}
                        style={{ marginRight: '0.5rem' }}
                    >
                        First Name{getSortDirectionIndicator('firstName')}
                    </button>
                    <button 
                        onClick={() => handleSort('lastName')}
                        style={{ marginRight: '0.5rem' }}
                    >
                        Last Name{getSortDirectionIndicator('lastName')}
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={handleUndo} 
                        disabled={history.length === 0}
                        style={{ 
                            opacity: history.length === 0 ? 0.5 : 1,
                            cursor: history.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                        title="Undo (Ctrl+Z)"
                    >
                        Undo
                    </button>
                    <button 
                        onClick={handleRedo} 
                        disabled={redoStack.length === 0}
                        style={{ 
                            opacity: redoStack.length === 0 ? 0.5 : 1,
                            cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                        title="Redo (Ctrl+Y)"
                    >
                        Redo
                    </button>
                </div>
            </div>
            
            <DataSheetGrid
                value={data}
                onChange={handleGridChange}
                columns={columns}
                createRow={createEmptyRow}
                rowHeight={35}
                headerRowHeight={40}
            />
        </div>
    )
}