import { redirect } from "next/navigation";

/**
 * MATRIX PAGE - Redirects to dashboard
 *
 * • Redirects users from /matrix to /dashboard
 * • Provides a clean navigation flow for users
 * • Maintains URL structure while directing to main dashboard
 *
 * Keywords: redirect, navigation, dashboard, matrix
 */
export default function MatrixPage() {
	redirect("/dashboard");
}
