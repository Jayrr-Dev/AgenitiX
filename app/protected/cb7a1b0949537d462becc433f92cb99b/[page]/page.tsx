"use server"

import Login from "@/features/auth/components/login";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import EmployeeDashboard from "@/features/employee/employee_dashboard";
import Timesheet from "@/features/employee/timesheet";
import Vacations from "@/features/employee/vacations";
import { getEmployeeData } from "@/utils/supabaseUtils";
import { getUserRole } from "@/utils/auth-utils";
  

interface PageProps {
  params: Promise<{
    page?: string;
  }>;
}

 


export default async function ProtectedPage({params}: PageProps) {
  const supabase = await createClient();
  const { data: user, error } = await supabase.auth.getUser()
  const { data: sessions } = await supabase.auth.getSession()
  const userRole = await getUserRole(sessions);
  const { page = '' } = await params;

  // Redirect to login if not an authorized role
  // if (!userRole || (userRole !== "employee" && userRole !== "admin" && userRole !== "manager")) {
  //   redirect('/');
  // }

  const viewComponents = {
    'login': () => {
      if (session) {
        redirect("./employee_dashboard");
      }
      return <Login  />
    },
    'employee_dashboard': () => {
      return <EmployeeDashboard authID={user?.user?.id || ""} userRole={userRole || ""}  />
    },
    'timesheet': async () => {
      const employeeData = await getEmployeeData(user?.user?.id || "");
      return <Timesheet employeeData={employeeData || []} authID={user?.user?.id || ""} userRole={userRole || ""} />
    },
    'vacations': () => {
      return <Vacations authID={user?.user?.id || ""} userRole={userRole || ""} />
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
