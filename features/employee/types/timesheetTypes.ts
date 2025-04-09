// Define the type for timesheet entries based on your data structure
export type TimesheetEntry = {
    authID: string;
    bt: number;
    company: string;
    created_at: string;
    department: string;
    descriptions: string;
    eid: number;
    entry_date: string;
    ht: number;
    id: number;
    km: number;
    name_code: string;
    ot: number;
    pay_period: number;
    project: string;
    project_id: number;
    rt: number;
    sl: number;
    status: boolean;
    task: number;
    title: string;
    type: string;
    updated_at: string;
    vt: number;
    we: string | null;
    wo: string;
    work_performed: string | null;
}


export type EmployeeData = {
    id: string;
    name: string;
    name_code: string;
    title: string;
    email: string;
    department?: string;
    company?: string;
}

