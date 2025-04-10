'use client'
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Vacations( {authID, userRole}: {authID: string, userRole: string} ) {
     //use auth ide to redirect to login page if not logged in for security
     useEffect(() => {
        if (!authID) {
            redirect('/');
        }
        // if (userRole !== "employee" && userRole !== "admin" && userRole !== "manager") {
        //     redirect('/');
        // }
    }, [authID, userRole]);
    return (
        <div>
            <h1>Vacations</h1>
        </div>
    )
}
