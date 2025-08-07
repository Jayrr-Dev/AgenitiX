"use client";

import { LogomarkSvg } from "@/branding/logomark-svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { UserDropdown } from "./UserDropdown";

export const ProtectedNavigation = () => {
	const { user } = useAuth();
	const { theme, setTheme } = useTheme();
	const [searchQuery, setSearchQuery] = useState("");
	const router = useRouter();
	const pathname = usePathname();

	// Fetch flows for search functionality
	const _flows = useQuery(api.flows.getUserFlows, user?.id ? { user_id: user.id as any } : "skip");

	const toggleTheme = () => {
		setTheme(theme === "dark" ? "light" : "dark");
	};

	return (
		<header className="sticky top-0 z-40 border-border border-b bg-background">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* Logo and main navigation */}
					<div className="flex items-center space-x-8">
						<Link href="/dashboard" className="flex items-center gap-3">
							<LogomarkSvg width={40} height={40} />
							<h1 className="font-bold text-foreground text-xl">AgenitiX</h1>
						</Link>
					</div>

					{/* Search, theme toggle, and user dropdown */}
					<div className="flex items-center space-x-4">
						<div className="relative hidden md:block w-64">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search workflows..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && searchQuery.trim() !== "") {
										// If already on dashboard, just update the URL with search param
										if (pathname === "/dashboard") {
											const searchParams = new URLSearchParams(window.location.search);
											searchParams.set("q", searchQuery);
											const newUrl = `/dashboard?${searchParams.toString()}`;
											window.history.pushState({}, "", newUrl);
											// Dispatch a custom event to notify dashboard of search
											window.dispatchEvent(
												new CustomEvent("navigation-search", {
													detail: { query: searchQuery },
												})
											);
										} else {
											// Navigate to dashboard with search query
											router.push(`/dashboard?q=${encodeURIComponent(searchQuery)}`);
										}
									}
								}}
								className="pl-8 h-9 md:w-[200px] lg:w-[250px] bg-background"
							/>
						</div>

						{/* Theme toggle */}
						<Button
							variant="ghost"
							size="icon"
							className="rounded-full"
							onClick={toggleTheme}
							aria-label="Toggle theme"
						>
							{theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
						</Button>
						<UserDropdown />
					</div>
				</div>
			</div>
		</header>
	);
};
