import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getUserRole } from "@/utils/auth-utils";
import { getCustomClaims } from "@/utils/auth-utils";
export default async function EmployeeDashboard() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {    
        return redirect("/");
    }
    const {
        data: { session },
    } = await supabase.auth.getSession()
    const userRole = await getUserRole(session);
    if (userRole !== "employee" && userRole !== "admin" && userRole !== "manager") {
        return redirect("/");
    }   
    return (
        <div>
            <h1>Employee Dashboard</h1>
        </div>
    )
}
