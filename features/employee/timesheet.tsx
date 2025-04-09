"use client"
//added react select
import {
    DataSheetGrid,
    checkboxColumn,
    textColumn,
    keyColumn,
    intColumn,
    floatColumn,
    Column
} from 'react-datasheet-grid'
import { useEffect, useRef, useState } from 'react'
import 'react-datasheet-grid/dist/style.css'
import { useTimesheetStore, type DataRow } from '@/store/timesheetStore' 
import { usePeriodStore } from '@/store/periodStore'
import { useProjectsStore } from '@/store/projectStore' // Import the projects store
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { selectColumn } from './selectColumn'
import { Project } from '@/store/projectStore'
import { TimesheetEntry, EmployeeData } from './types/timesheetTypes'
import { formatNumber } from './utils/formatNumber'
export default function Timesheet({ employeeData, authID }: { employeeData: EmployeeData[], authID: string }) {
    // State variables
    const { period, setPeriod } = usePeriodStore();
    const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{message: string, type: 'success' | 'error' | 'idle'}>({
        message: '',
        type: 'idle'
    });
    const [showTotals, setShowTotals] = useState(true);
    const [projectsStatus, setProjectsStatus] = useState<'loading' | 'cached' | 'fresh' | 'error'>('loading');
    
    // Use the projects store instead of local state
    const { projects, setProjects, clearProjects } = useProjectsStore();
    
    const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Supabase client
    const supabase = createClient();
    
    // Use our Zustand store
    const {
        data,
        setData,
        upsertData,
        updateData,
        history,
        addToHistory,
        redoStack,
        sortConfig,
        handleSort,
        handleUndo,
        handleRedo,
        resetStore
    } = useTimesheetStore();
    
    // Function to fetch projects from Supabase
    const fetchProjects = async (forceRefresh = false) => {
        try {
            setProjectsStatus('loading');
            
            // Check if we already have projects in the store and not forcing refresh
            if (!forceRefresh && projects.length > 0) {
                console.log('Using cached projects data from store');
                setProjectsStatus('cached');
                return;
            }
            
            // If forcing refresh or no projects in store, fetch from Supabase
            const { data, error } = await supabase
                .from('projects')
                .select('id, description');
            
            if (error) {
                console.error('Error fetching projects:', error);
                setProjectsStatus('error');
                return;
            }
            
            // Save to the Zustand store
            setProjects(data || []);
            setProjectsStatus('fresh');
            console.log('Projects data refreshed from server');
        } catch (error) {
            console.error('Error in fetching projects:', error);
            setProjectsStatus('error');
        }
    };
    
    // Load projects data for dropdown on component mount
    useEffect(() => {
        fetchProjects();
    }, [supabase]);
    
    // Fetch timesheet entries effect
    useEffect(() => {
        const fetchTimesheetEntries = async () => {
            setLoading(true);
            setSaveStatus({message: '', type: 'idle'});
            
            try {
                const { data, error } = await supabase
                    .from('timesheet_entries')
                    .select('*')
                    .eq('authID', authID)
                    .eq('pay_period', period);
                
                if (error) {
                    console.error('Error fetching timesheet entries:', error);
                    setSaveStatus({
                        message: 'Failed to load timesheet data',
                        type: 'error'
                    });
                    return;
                }
                
                setTimesheetEntries(data || []);
                
                // Convert timesheet entries to DataRow format and update the store
                if (data && data.length > 0) {
                    const formattedData = data.map(entry => ({
                        id: entry.id,
                        status: entry.status,
                        entryDate: entry.entry_date, // Keep as string
                        project: entry.project,
                        projectId: entry.project_id,
                        workOrder: entry.wo,
                        description: entry.descriptions,
                        regularTime: entry.rt,
                        overtimeTime: entry.ot,
                        holidayTime: entry.ht,
                        vacationTime: entry.vt,
                        bankTime: entry.bt,
                        sickLeaveTime: entry.sl,
                        km: entry.km,
                        workPerformed: entry.work_performed || '',
                        type: entry.type,
                        task: entry.task
                    }));
                    upsertData(formattedData);
                } else {
                    // Reset with empty data if no entries found
                    resetStore();
                }
            } catch (error) {
                console.error('Error in fetch operation:', error);
                setSaveStatus({
                    message: 'An error occurred while loading data',
                    type: 'error'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTimesheetEntries();
        
        // Clean up status message after 5 seconds
        return () => {
            if (statusTimeoutRef.current) {
                clearTimeout(statusTimeoutRef.current);
            }
        };
    }, [period, authID, supabase, resetStore, updateData]);
    
    // Debounce timer ref with NodeJS.Timeout type
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    // Previous data ref to compare for actual changes
    const prevDataRef = useRef<string>(JSON.stringify(data));
    
    // Clean up the timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current !== null) {
                clearTimeout(debounceTimerRef.current);
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
            
            // Check for Ctrl+S for Save
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                saveChanges();
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
    const getSortDirectionIndicator = (key: string) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    };
    
    // Calculate totals for the footer
    const calculateTotals = () => {
        return data.reduce(
            (acc, row) => {
                acc.regularTime += Number(row.regularTime) || 0;
                acc.overtimeTime += Number(row.overtimeTime) || 0;
                acc.holidayTime += Number(row.holidayTime) || 0;
                acc.vacationTime += Number(row.vacationTime) || 0;
                acc.bankTime += Number(row.bankTime) || 0;
                acc.sickLeaveTime += Number(row.sickLeaveTime) || 0;
                acc.km += Number(row.km) || 0;
                acc.totalTime = 
                    acc.regularTime + 
                    acc.overtimeTime + 
                    acc.holidayTime + 
                    acc.vacationTime + 
                    acc.bankTime + 
                    acc.sickLeaveTime;
                return acc;
            },
            { 
                regularTime: 0, 
                overtimeTime: 0, 
                holidayTime: 0, 
                vacationTime: 0,
                bankTime: 0,
                sickLeaveTime: 0,
                km: 0,
                totalTime: 0
            }
        );
    };
    
    const totals = calculateTotals();

    // Format a number to fixed 2 decimal places if needed
   

    // Updated columns to match your data structure
    const columns: Column[] | any = [
        { 
            ...keyColumn('status', checkboxColumn), 
            title: 'Status',
            width: 70
        },
        { 
            ...keyColumn('entryDate', textColumn), 
            title: 'Date',
            width: 110,
        },
        { 
            ...keyColumn('project', textColumn), 
            title: 'Project #',
            width: 120,
        },
        { 
            ...keyColumn('workOrder', textColumn), 
            title: 'WO #', 
            width: 100
        },
        {
            ...keyColumn('task', intColumn),
            title: 'Task',
            width: 70
        },
        { 
            // Use the selectColumn for the description field with data from the Zustand store
            ...keyColumn('description', selectColumn({
                choices: projects.map((project: Project) => ({
                    value: project.id,
                    label: project.description
                })),
                disabled: false,
                placeholder: 'Select Project',
            })), 
            title: 'Description',
            minWidth: 200,
            grow: 1,
        },
        { 
            ...keyColumn('regularTime', floatColumn), 
            title: 'RT',
            width: 60
        },
        { 
            ...keyColumn('overtimeTime', floatColumn), 
            title: 'OT',
            width: 60 
        },
        { 
            ...keyColumn('holidayTime', floatColumn), 
            title: 'HT',
            width: 60
        },
        { 
            ...keyColumn('vacationTime', floatColumn), 
            title: 'VT',
            width: 60
        },
        { 
            ...keyColumn('bankTime', floatColumn), 
            title: 'BT',
            width: 60
        },
        { 
            ...keyColumn('sickLeaveTime', floatColumn), 
            title: 'SL',
            width: 60
        },
        { 
            ...keyColumn('km', floatColumn), 
            title: 'KM',
            width: 70
        },
        { 
            ...keyColumn('workPerformed', textColumn), 
            title: 'Work Performed',
            minWidth: 150,
            grow: 1,
        },
        { 
            ...keyColumn('type', textColumn), 
            title: 'Type',
            width: 100,
        }
    ];

    // Function to create a new empty row
    const createEmptyRow = () => ({
        id: Date.now(), // Temporary ID for new rows
        status: false,
        entryDate: new Date().toISOString().split('T')[0], // Today's date as string in YYYY-MM-DD format
        project: '',
        projectId: 0,
        workOrder: '',
        description: '',
        regularTime: 0,
        overtimeTime: 0, 
        holidayTime: 0,
        vacationTime: 0,
        bankTime: 0,
        sickLeaveTime: 0,
        km: 0,
        workPerformed: '',
        type: 'Project',
        task: 0
    });

    // Function to handle grid changes with debouncing
    const handleGridChange = (value: any) => {
        // Clear any existing timer
        if (debounceTimerRef.current !== null) {
            clearTimeout(debounceTimerRef.current);
        }
        
        // Set data immediately without updating history
        setData(value);
        // Wait for 500ms of inactivity before adding to history
        const timeout = setTimeout(() => {
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

    // Function to save changes to Supabase
    const saveChanges = async () => {
        if (isSaving) return; // Prevent multiple save attempts
        
        setIsSaving(true);
        setSaveStatus({message: 'Saving changes...', type: 'idle'});
        
        try {
            // Filter out empty rows
            const validData = data.filter(row => 
                row.project || 
                row.workOrder || 
                row.description || 
                row.regularTime || 
                row.overtimeTime || 
                row.holidayTime ||
                row.vacationTime ||
                row.bankTime ||
                row.sickLeaveTime ||
                row.km
            );
            
            // Convert DataRow format back to TimesheetEntry format
            const updatedEntries = validData.map(row => ({
                authID: authID,
                bt: Number(row.bankTime) || 0,
                company: employeeData[0]?.company || "",
                department: employeeData[0]?.department || "",
                descriptions: row.description,
                eid: parseInt(employeeData[0]?.id) || 0,
                entry_date: row.entryDate,
                ht: Number(row.holidayTime) || 0,
                id: typeof row.id === 'number' ? row.id : parseInt(row.id),
                km: Number(row.km) || 0,
                name_code: employeeData[0]?.name_code || "",
                ot: Number(row.overtimeTime) || 0,
                pay_period: period,
                project: row.project,
                project_id: row.projectId || null,
                rt: Number(row.regularTime) || 0,
                sl: Number(row.sickLeaveTime) || 0,
                status: Boolean(row.status),
                task: row.task || 0,
                title: employeeData[0]?.title || "",
                type: row.type || "Project",
                vt: Number(row.vacationTime) || 0,
                we: null,
                wo: row.workOrder || "",
                work_performed: row.workPerformed || null
            }));
            
            // Identify existing entries (have a permanent ID) and new entries
            const existingEntries = updatedEntries.filter(entry => {
                const originalEntry = timesheetEntries.find(te => te.id === entry.id);
                return originalEntry !== undefined;
            });
            
            const newEntries = updatedEntries.filter(entry => {
                const originalEntry = timesheetEntries.find(te => te.id === entry.id);
                return originalEntry === undefined;
            }).map(entry => {
                // Remove ID for new entries to let Supabase generate it
                const { id, ...entryWithoutId } = entry;
                return entryWithoutId;
            });
            
            // Get deleted entries (exist in original but not in updated)
            const deletedEntryIds = timesheetEntries
                .filter(originalEntry => !updatedEntries.some(entry => entry.id === originalEntry.id))
                .map(entry => entry.id);
            
            // Batch the operations
            const batch = [];
            
            // Add upsert operation for existing entries if any
            if (existingEntries.length > 0) {
                batch.push(supabase
                    .from('timesheet_entries')
                    .upsert(existingEntries));
            }
            
            // Add insert operation for new entries if any
            if (newEntries.length > 0) {
                batch.push(supabase
                    .from('timesheet_entries')
                    .insert(newEntries));
            }
            
            // Add delete operation for deleted entries if any
            if (deletedEntryIds.length > 0) {
                batch.push(supabase
                    .from('timesheet_entries')
                    .delete()
                    .in('id', deletedEntryIds));
            }
            
            // Execute all operations
            if (batch.length > 0) {
                const results = await Promise.all(batch);
                
                // Check for errors
                const errors = results.filter(result => result.error);
                
                if (errors.length > 0) {
                    console.error('Errors saving timesheet entries:', errors);
                    setSaveStatus({
                        message: 'Failed to save some changes',
                        type: 'error'
                    });
                } else {
                    // Refresh data after successful save
                    const { data: refreshedData, error } = await supabase
                        .from('timesheet_entries')
                        .select('*')
                        .eq('authID', authID)
                        .eq('pay_period', period);
                        
                    if (!error && refreshedData) {
                        setTimesheetEntries(refreshedData);
                        
                        // Convert refreshed data back to DataRow format
                        const formattedData = refreshedData.map(entry => ({
                            id: entry.id,
                            status: entry.status,
                            entryDate: entry.entry_date,
                            project: entry.project,
                            projectId: entry.project_id,
                            workOrder: entry.wo,
                            description: entry.descriptions,
                            regularTime: entry.rt,
                            overtimeTime: entry.ot,
                            holidayTime: entry.ht,
                            vacationTime: entry.vt,
                            bankTime: entry.bt,
                            sickLeaveTime: entry.sl,
                            km: entry.km,
                            workPerformed: entry.work_performed || '',
                            type: entry.type,
                            task: entry.task
                        }));
                        
                        setData(formattedData);
                    }
                    
                    setSaveStatus({
                        message: 'Changes saved successfully!',
                        type: 'success'
                    });
                }
            } else {
                setSaveStatus({
                    message: 'No changes to save',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            setSaveStatus({
                message: 'An error occurred while saving',
                type: 'error'
            });
        } finally {
            setIsSaving(false);
            
            // Clear status message after 5 seconds
            if (statusTimeoutRef.current) {
                clearTimeout(statusTimeoutRef.current);
            }
            
            const timeout = setTimeout(() => {
                setSaveStatus({message: '', type: 'idle'});
            }, 5000) as any
            statusTimeoutRef.current = timeout;
        }
    };
    
    // Function to export data to CSV
    const exportToCSV = () => {
        if (data.length === 0) {
            alert('No data to export');
            return;
        }
        
        // Format the data for CSV
        const headers = [
            'Date', 
            'Project', 
            'WO #', 
            'Task',
            'Description', 
            'RT', 
            'OT', 
            'HT', 
            'VT',
            'BT',
            'SL',
            'KM', 
            'Work Performed', 
            'Type'
        ];
        
        const csvRows = [
            headers.join(','),
            ...data.map(row => [
                row.entryDate,
                `"${row.project}"`,
                `"${row.workOrder}"`,
                row.task,
                `"${row.description.replace(/"/g, '""')}"`,
                row.regularTime,
                row.overtimeTime,
                row.holidayTime,
                row.vacationTime,
                row.bankTime,
                row.sickLeaveTime,
                row.km,
                `"${(row.workPerformed || '').replace(/"/g, '""')}"`,
                `"${row.type}"`
            ].join(','))
        ];
        
        // Create and download CSV file
        const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Timesheet_Period${period}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 max-w-full overflow-x-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h1 className="text-2xl font-bold mb-4 md:mb-0">Timesheet</h1>
                
                {/* Period selector and info */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">Pay Period:</span>
                        <input 
                            className="border-2 border-gray-300 rounded-md px-2 py-1 text-center w-16" 
                            type="number" 
                            min={1} 
                            max={26} 
                            value={period} 
                            onChange={(e) => setPeriod(parseInt(e.target.value) || 1)} 
                        />
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => fetchProjects(true)}
                            className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-1"
                            title="Refresh Projects"
                            disabled={projectsStatus === 'loading'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" 
                                className={`h-4 w-4 ${projectsStatus === 'loading' ? 'animate-spin' : ''}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {projectsStatus === 'loading' ? 'Loading...' : 'Refresh Projects'}
                        </button>
                        <button 
                            onClick={exportToCSV}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                            title="Export to CSV"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Status indicator for projects data */}
            <div className="mb-4 flex items-center">
                <span className="mr-2">Projects data:</span>
                {projectsStatus === 'loading' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading
                    </span>
                )}
                {projectsStatus === 'cached' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-green-800" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                        </svg>
                        Using cached data ({projects.length} projects)
                    </span>
                )}
                {projectsStatus === 'fresh' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-blue-800" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                        </svg>
                        Freshly loaded ({projects.length} projects)
                    </span>
                )}
                {projectsStatus === 'error' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-red-800" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                        </svg>
                        Error loading projects
                    </span>
                )}
                
                {projects.length > 0 && (
                    <button 
                        onClick={() => {
                            if (confirm("Are you sure you want to clear the cached projects data?")) {
                                clearProjects();
                                fetchProjects(true);
                            }
                        }}
                        className="ml-2 text-xs text-gray-600 hover:text-red-600 underline"
                    >
                        Clear cache
                    </button>
                )}
            </div>
            
            {/* Employee Data Card */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <span className="font-bold text-gray-600">Employee ID:</span> {employeeData[0]?.id}
                    </div>
                    <div>
                        <span className="font-bold text-gray-600">Name:</span> {employeeData[0]?.name}
                    </div>
                    <div>
                        <span className="font-bold text-gray-600">Title:</span> {employeeData[0]?.title}
                    </div>
                    {employeeData[0]?.department && (
                        <div>
                            <span className="font-bold text-gray-600">Department:</span> {employeeData[0]?.department}
                        </div>
                    )}
                    {employeeData[0]?.company && (
                        <div>
                            <span className="font-bold text-gray-600">Company:</span> {employeeData[0]?.company}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Status message */}
            {saveStatus.message && (
                <div className={`mb-4 p-3 rounded-md ${
                    saveStatus.type === 'success' ? 'bg-green-100 text-green-800' : 
                    saveStatus.type === 'error' ? 'bg-red-100 text-red-800' : 
                    'bg-blue-100 text-blue-800'
                }`}>
                    {saveStatus.message}
                </div>
            )}
            
            {loading ? (
                <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                </div>
            ) : (
                <>
                    {/* Controls */}
                    <div className="flex flex-wrap justify-between mb-4 gap-2">
                        {/* Sort buttons */}
                        <div className="flex flex-wrap gap-2">
                            <span className="flex items-center text-gray-600 mr-1">Sort by:</span>
                            <button 
                                onClick={() => handleSort('entryDate')}
                                className={`px-3 py-1 rounded-md ${
                                    sortConfig.key === 'entryDate' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                Date{getSortDirectionIndicator('entryDate')}
                            </button>
                            <button 
                                onClick={() => handleSort('project')}
                                className={`px-3 py-1 rounded-md ${
                                    sortConfig.key === 'project' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                Project{getSortDirectionIndicator('project')}
                            </button>
                            <button 
                                onClick={() => handleSort('type')}
                                className={`px-3 py-1 rounded-md ${
                                    sortConfig.key === 'type' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                Type{getSortDirectionIndicator('type')}
                            </button>
                            <button 
                                onClick={() => handleSort('status')}
                                className={`px-3 py-1 rounded-md ${
                                    sortConfig.key === 'status' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                Status{getSortDirectionIndicator('status')}
                            </button>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-2">
                            <button 
                                onClick={handleUndo} 
                                disabled={history.length === 0}
                                className={`px-3 py-1 bg-gray-200 rounded-md flex items-center gap-1 ${history.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}`}
                                title="Undo (Ctrl+Z)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a4 4 0 0 1 4 4v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                Undo
                            </button>
                            <button 
                                onClick={handleRedo} 
                                disabled={redoStack.length === 0}
                                className={`px-3 py-1 bg-gray-200 rounded-md flex items-center gap-1 ${redoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}`}
                                title="Redo (Ctrl+Y)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a4 4 0 0 0-4 4v2M21 10l-6 6m6-6l-6-6" />
                                </svg>
                                Redo
                            </button>
                            <button 
                                onClick={() => setShowTotals(!showTotals)}
                                className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 flex items-center gap-1"
                                title="Toggle Totals"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                {showTotals ? 'Hide Totals' : 'Show Totals'}
                            </button>
                            <button 
                                onClick={saveChanges}
                                disabled={isSaving}
                                className={`px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                title="Save Changes (Ctrl+S)"
                            >
                                {isSaving ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                )}
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                    
                    {/* Data Grid */}
                    <div className="border rounded-lg overflow-hidden mb-4 shadow-sm">
                        <DataSheetGrid
                            value={data}
                            onChange={handleGridChange}
                            columns={columns as any}
                            createRow={createEmptyRow}
                            rowHeight={40}
                            headerRowHeight={45}
                            autoAddRow={false}
                            lockRows={isSaving}
                            className="w-full"
                        />
                    </div>
                    
                    {/* Summary/Totals Section */}
                    {showTotals && (
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
                            <h3 className="text-lg font-semibold mb-3 text-gray-700">Time Summary</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                    <div className="text-xs text-gray-500 uppercase">Regular Time</div>
                                    <div className="text-xl font-bold text-blue-600">{formatNumber(totals.regularTime)}</div>
                                </div>
                                <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                    <div className="text-xs text-gray-500 uppercase">Overtime</div>
                                    <div className="text-xl font-bold text-orange-600">{formatNumber(totals.overtimeTime)}</div>
                                </div>
                                <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                    <div className="text-xs text-gray-500 uppercase">Holiday</div>
                                    <div className="text-xl font-bold text-purple-600">{formatNumber(totals.holidayTime)}</div>
                                </div>
                                <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                    <div className="text-xs text-gray-500 uppercase">Vacation</div>
                                    <div className="text-xl font-bold text-green-600">{formatNumber(totals.vacationTime)}</div>
                                </div>
                                <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                    <div className="text-xs text-gray-500 uppercase">Bank</div>
                                    <div className="text-xl font-bold text-gray-600">{formatNumber(totals.bankTime)}</div>
                                </div>
                                <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                    <div className="text-xs text-gray-500 uppercase">Sick Leave</div>
                                    <div className="text-xl font-bold text-red-600">{formatNumber(totals.sickLeaveTime)}</div>
                                </div>
                                <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                    <div className="text-xs text-gray-500 uppercase">Total KM</div>
                                    <div className="text-xl font-bold text-teal-600">{formatNumber(totals.km)}</div>
                                </div>
                            </div>
                            <div className="mt-4 bg-blue-50 p-3 rounded shadow-sm border border-blue-100">
                                <div className="text-sm text-blue-700 font-medium">Total Hours</div>
                                <div className="text-2xl font-bold text-blue-800">{formatNumber(totals.totalTime)}</div>
                            </div>
                        </div>
                    )}
                    
                    {/* Help/Info Section */}
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-100 mb-4">
                        <h3 className="text-lg font-semibold mb-2">Keyboard Shortcuts</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="flex items-center">
                                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm mr-2">Ctrl+Z</kbd>
                                <span>Undo changes</span>
                            </div>
                            <div className="flex items-center">
                                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm mr-2">Ctrl+Y</kbd>
                                <span>Redo changes</span>
                            </div>
                            <div className="flex items-center">
                                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm mr-2">Ctrl+S</kbd>
                                <span>Save changes</span>
                            </div>
                            <div className="flex items-center">
                                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm mr-2">Tab</kbd>
                                <span>Move to next cell</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}