"use client";

import Link from "next/link";
import { useAuthContext } from "./AuthProvider";
import { UserDropdown } from "./UserDropdown";

export const ProtectedNavigation = () => {
	const { user } = useAuthContext();

	return (
		<header className="bg-background border-b border-border sticky top-0 z-40">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* Logo and main navigation */}
					<div className="flex items-center space-x-8">
						<Link href="/dashboard" className="flex items-center">
							<h1 className="text-xl font-bold text-foreground">AgenitiX</h1>
						</Link>
					</div>

					{/* User info and dropdown */}
					<div className="flex items-center space-x-4">
						<span className="hidden sm:block text-sm text-muted-foreground">
							Welcome back, {user?.name}
						</span>
						<UserDropdown />
					</div>
				</div>
			</div>
		</header>
	);
};
