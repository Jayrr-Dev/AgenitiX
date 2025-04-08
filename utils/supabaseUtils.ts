//get supabase data from employee table id, name, title, namecode, email based on authID        
import { Database } from "@/types/database.types";
import { createClient } from "@/utils/supabase/server";

export async function getEmployeeData(authID: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, name, name_code, title, email")
    .eq("authID", authID);
  if (error) {
    console.error("Error fetching employee data:", error);
  }
  return data;
}          

//get timesheet_entries for employee based on period
export async function getTimesheetEntries(authID: string, period: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timesheet_entries")
    .select("*")
    .eq("authID", authID)
    .eq("period", period);
  if (error) {
    console.error("Error fetching timesheet entries:", error);
  }
  return data;
}
