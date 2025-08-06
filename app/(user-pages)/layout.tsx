"use client";

import { ProtectedNavigation } from "@/components/auth/ProtectedNavigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthCollisionTester } from "@/components/auth/AuthCollisionTester";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface UserPagesLayoutProps {
	children: ReactNode;
}

export default function UserPagesLayout({ children }: UserPagesLayoutProps) {
	const pathname = usePathname();

	// Hide navigation for matrix routes
	const shouldHideNavigation = pathname.startsWith("/matrix");

	return (
		<ProtectedRoute>
			<div className="min-h-screen bg-background">
				{!shouldHideNavigation && <ProtectedNavigation />}
				<main>{children}</main>
				<AuthCollisionTester />
			</div>
		</ProtectedRoute>
	);
}
