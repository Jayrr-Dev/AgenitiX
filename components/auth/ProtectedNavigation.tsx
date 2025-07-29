"use client";

import Link from "next/link";
import { useAuthContext } from "./AuthProvider";
import { UserDropdown } from "./UserDropdown";

export const ProtectedNavigation = () => {
	const { user } = useAuthContext();

	return (
        <header className="sticky top-0 z-40 border-border border-b bg-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* Logo and main navigation */}
					<div className="flex items-center space-x-8">
						<Link href="/dashboard" className="flex items-center" legacyBehavior>
							<h1 className="font-bold text-foreground text-xl">AgenitiX</h1>
						</Link>
					</div>

					{/* User info and dropdown */}
					<div className="flex items-center space-x-4">
						<span className="hidden text-muted-foreground text-sm sm:block">
							Welcome back, {user?.name}
						</span>
						<UserDropdown />
					</div>
				</div>
			</div>
        </header>
    );
};
