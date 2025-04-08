"use server"

import Login from "@/features/auth/components/login";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import EmployeeDashboard from "@/features/employee/employee_dashboard";
import Timesheet from "@/features/employee/timesheet";
import Vacations from "@/features/employee/vacations";
import { getEmployeeData } from "@/utils/supabaseUtils";

  

interface PageProps {
  params: Promise<{
    page?: string;
  }>;
}




export default async function ProtectedPage({params}: PageProps) {
  const supabase = await createClient();
  const { data: user, error } = await supabase.auth.getUser()
  const { page = '' } = await params;
  const viewComponents = {
    'login': () => {
      if (session) {
        redirect("./employee_dashboard");
      }
      return <Login />
    },
    'employee_dashboard': () => {
      return <EmployeeDashboard />
    },
    'timesheet': async () => {
      const employeeData = await getEmployeeData(user?.user?.id || "");
      return <Timesheet employeeData={employeeData || []} authID={user?.user?.id || ""} />
    },
    'vacations': () => {
      return <Vacations />
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

 

  const employeeData = await getEmployeeData(user?.user?.id || "");


  return (
    <main>
        
        {viewComponents[page as keyof typeof viewComponents]()}

    </main>
  );
}
