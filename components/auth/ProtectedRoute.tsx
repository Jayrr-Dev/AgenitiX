"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuthContext } from "./AuthProvider";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
	children: ReactNode;
	fallback?: ReactNode;
}

export const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
	const { user, isLoading, isAuthenticated } = useAuthContext();
	const router = useRouter();
	const [mounted, setMounted] = useState(false);

	// Ensure component is mounted to avoid hydration issues
	useEffect(() => {
		setMounted(true);
	}, []);

	// Redirect to sign-in if not authenticated
	useEffect(() => {
		if (mounted && !isLoading && !isAuthenticated) {
			router.push("/sign-in");
		}
	}, [mounted, isLoading, isAuthenticated, router]);

	// Show loading state while checking auth or not mounted yet
	if (!mounted || isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	// Show loading while redirecting if not authenticated
	if (!isAuthenticated || !user) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Redirecting to sign in...</p>
				</div>
			</div>
		);
	}

	// Show protected content
	return <>{children}</>;
};