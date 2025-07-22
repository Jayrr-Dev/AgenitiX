"use client";
import { redirect } from "next/navigation";

import { useEffect } from "react";
export default function EmployeeDashboard({
	authID,
	userRole,
}: { authID: string; userRole: string }) {
	//use auth ide to redirect to login page if not logged in for security
	useEffect(() => {
		if (!authID) {
			redirect("/");
		}
	}, [authID]);

	// if (userRole !== "employee" && userRole !== "admin" && userRole !== "manager") {
	//     redirect('/');
	// }

	return (
		<div>
			<h1>Employee Dashboard</h1>
		</div>
	);
}
