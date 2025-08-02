"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { Loading } from "@/components/Loading";
import { useAuthContext } from "./AuthProvider";

interface ProtectedRouteProps {
	children: ReactNode;
	fallback?: ReactNode;
}

export const ProtectedRoute = ({ children }: Pick<ProtectedRouteProps, "children">) => {
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
			<Loading 
				className="min-h-screen bg-background"
				size="w-12 h-12" 
				text="Loading..."
				textSize="text-base"
			/>
		);
	}

	// Show loading while redirecting if not authenticated
	if (!(isAuthenticated && user)) {
		return (
			<Loading 
				className="min-h-screen bg-background"
				size="w-12 h-12" 
				text="Redirecting to sign in..."
				textSize="text-base"
			/>
		);
	}

	// Show protected content
	return <>{children}</>;
};
