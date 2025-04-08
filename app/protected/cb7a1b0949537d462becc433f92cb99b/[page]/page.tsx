
import Login from "@/features/auth/components/login";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import EmployeeDashboard from "@/features/employee/employee_dashboard";
import Timesheet from "@/features/employee/timesheet";
import Vacations from "@/features/employee/vacations";
interface PageProps {
  params: Promise<{
    page?: string;
  }>;
}

export default async function ProtectedPage({params}: PageProps) {
  const supabase = await createClient();
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
    'timesheet': () => {
      return <Timesheet />
    },
    'vacations': () => {
      return <Vacations />
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  
  return (
    <main>
        
        {viewComponents[page as keyof typeof viewComponents]()}

    </main>
  );
}
