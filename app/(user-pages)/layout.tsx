"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProtectedNavigation } from "@/components/auth/ProtectedNavigation";
import { ReactNode } from "react";

interface UserPagesLayoutProps {
	children: ReactNode;
}

export default function UserPagesLayout({ children }: UserPagesLayoutProps) {
	return (
		<ProtectedRoute>
			<div className="min-h-screen bg-background">
				<ProtectedNavigation />
				<main>
					{children}
				</main>
			</div>
		</ProtectedRoute>
	);
}