"use client";

import { CustomLogo } from "@/branding/custom-logo";
import type { RouteProtectionConfig } from "@/types/anubis";
import { useEffect, useState } from "react";
import { useAnubis } from "./AnubisProvider";

// AGENITIX CONTROL PANEL COMPONENT
export function AnubisControlPanel() {
	const { isEnabled, currentRoute, toggleProtection, updateConfig } = useAnubis();

	// ALL STATE HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
	const [showUI, setShowUI] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [newRoutePath, setNewRoutePath] = useState("");
	const [protectedRoutes, setProtectedRoutes] = useState<RouteProtectionConfig[]>([]);
	const [globalEnabled, setGlobalEnabled] = useState(isEnabled);

	// ALL EFFECT HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
	useEffect(() => {
		const saved = localStorage.getItem("anubis-ui-enabled");
		setShowUI(saved === "true");
	}, []);

	// LOAD PROTECTED ROUTES
	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const loadRoutes = () => {
			try {
				const savedRoutes = localStorage.getItem("anubis-protected-routes");
				if (savedRoutes) {
					const routes = JSON.parse(savedRoutes) as RouteProtectionConfig[];
					setProtectedRoutes(routes);
				}
			} catch (error) {
				console.error("Failed to load routes:", error);
			}
		};

		loadRoutes();
		setGlobalEnabled(isEnabled);
	}, [isEnabled]);

	// NOW WE CAN HAVE CONDITIONAL RETURNS
	if (!showUI) {
		return null;
	}

	// TOGGLE GLOBAL PROTECTION
	const handleGlobalToggle = () => {
		const newEnabled = !globalEnabled;
		setGlobalEnabled(newEnabled);
		updateConfig({ enabled: newEnabled });
	};

	// ADD NEW PROTECTED ROUTE
	const handleAddRoute = () => {
		if (!newRoutePath.trim()) {
			return;
		}

		const path = newRoutePath.startsWith("/") ? newRoutePath : `/${newRoutePath}`;
		toggleProtection(path, true);

		// UPDATE LOCAL STATE
		const newRoute: RouteProtectionConfig = {
			path,
			enabled: true,
			description: `Protected route: ${path}`,
		};

		setProtectedRoutes((prev) => [...prev.filter((r) => r.path !== path), newRoute]);
		setNewRoutePath("");
	};

	// TOGGLE ROUTE PROTECTION
	const handleRouteToggle = (path: string, enabled: boolean) => {
		toggleProtection(path, enabled);
		setProtectedRoutes((prev) =>
			prev.map((route) => (route.path === path ? { ...route, enabled } : route))
		);
	};

	// REMOVE ROUTE
	const handleRemoveRoute = (path: string) => {
		toggleProtection(path, false);
		setProtectedRoutes((prev) => prev.filter((route) => route.path !== path));

		// REMOVE FROM LOCAL STORAGE
		if (typeof window !== "undefined") {
			try {
				const savedRoutes = localStorage.getItem("anubis-protected-routes");
				if (savedRoutes) {
					const routes = JSON.parse(savedRoutes) as RouteProtectionConfig[];
					const filteredRoutes = routes.filter((route) => route.path !== path);
					localStorage.setItem("anubis-protected-routes", JSON.stringify(filteredRoutes));
				}
			} catch (error) {
				console.error("Failed to remove route:", error);
			}
		}
	};

	// PROTECT CURRENT ROUTE
	const handleProtectCurrentRoute = () => {
		toggleProtection(currentRoute, true);

		const newRoute: RouteProtectionConfig = {
			path: currentRoute,
			enabled: true,
			description: `Protected route: ${currentRoute}`,
		};

		setProtectedRoutes((prev) => [...prev.filter((r) => r.path !== currentRoute), newRoute]);
	};

	// CHECK IF CURRENT ROUTE IS PROTECTED
	const isCurrentRouteProtected = protectedRoutes.some(
		(route) => route.path === currentRoute && route.enabled
	);

	// FLOATING BUTTON WHEN CLOSED
	if (!isOpen) {
		return (
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className="fixed bottom-4 left-4 rounded-full border border-transparent bg-fill-border p-3 shadow-lg backdrop-blur-lg transition-all duration-300 hover:animate-fill-transparency"
				title="Open AgenitiX-Anti-Bot Control Panel"
			>
				<CustomLogo size={24} />
			</button>
		);
	}

	// MAIN CONTROL PANEL
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-transparent bg-background bg-fill-border shadow-2xl backdrop-blur-lg">
				{/* HEADER */}
				<div className="flex items-center justify-between border-border border-b p-6">
					<div className="flex items-center gap-3">
						<div className="rounded-lg border border-transparent bg-fill-border p-2 hover:animate-fill-transparency">
							<CustomLogo size={32} />
						</div>
						<div>
							<h2 className="font-brand text-foreground text-xl">AgenitiX Control Panel</h2>
							<p className="text-muted-foreground text-sm">Manage bot protection settings</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="rounded-lg border border-transparent bg-fill-border p-2 text-muted-foreground transition-colors hover:animate-fill-transparency hover:text-foreground"
					>
						✕
					</button>
				</div>

				{/* GLOBAL SETTINGS */}
				<div className="border-border border-b p-6">
					<h3 className="mb-4 font-semibold font-ui text-foreground text-lg">Global Settings</h3>

					<div className="flex items-center justify-between rounded-lg border border-transparent bg-fill-border p-4 hover:animate-fill-transparency">
						<div>
							<label className="font-medium text-foreground text-sm">
								Enable AgenitiX Protection
							</label>
							<p className="text-muted-foreground text-xs">
								Globally enable or disable bot protection
							</p>
						</div>
						<button
							type="button"
							onClick={handleGlobalToggle}
							className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
								globalEnabled ? "bg-secondary shadow-[0_0_8px_2px_rgba(34,197,94,0.6)]" : "bg-muted"
							}`}
						>
							<span
								className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
									globalEnabled ? "translate-x-6" : "translate-x-1"
								}`}
							/>
						</button>
					</div>
				</div>

				{/* CURRENT ROUTE */}
				<div className="border-border border-b p-6">
					<h3 className="mb-4 font-semibold font-ui text-foreground text-lg">Current Route</h3>

					<div className="flex items-center justify-between rounded-lg border border-transparent bg-fill-border p-4 hover:animate-fill-transparency">
						<div>
							<code className="rounded bg-muted px-2 py-1 font-mono text-foreground text-sm">
								{currentRoute}
							</code>
							<p className="mt-1 text-muted-foreground text-xs">
								{isCurrentRouteProtected ? "🛡️ Protected" : "🔓 Unprotected"}
							</p>
						</div>
						<button
							type="button"
							onClick={handleProtectCurrentRoute}
							disabled={isCurrentRouteProtected}
							className={`rounded-lg border border-transparent px-4 py-2 font-medium text-sm transition-all duration-300 ${
								isCurrentRouteProtected
									? "cursor-not-allowed bg-muted text-muted-foreground"
									: "bg-fill-border text-foreground hover:animate-fill-transparency"
							}`}
						>
							{isCurrentRouteProtected ? "Protected" : "Protect This Route"}
						</button>
					</div>
				</div>

				{/* ADD NEW ROUTE */}
				<div className="border-border border-b p-6">
					<h3 className="mb-4 font-semibold font-ui text-foreground text-lg">
						Add Protected Route
					</h3>

					<div className="flex gap-2">
						<input
							type="text"
							value={newRoutePath}
							onChange={(e) => setNewRoutePath(e.target.value)}
							placeholder="/path/to/protect"
							className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
							onKeyPress={(e) => e.key === "Enter" && handleAddRoute()}
						/>
						<button
							type="button"
							onClick={handleAddRoute}
							disabled={!newRoutePath.trim()}
							className="rounded-lg border border-transparent bg-fill-border px-4 py-2 font-medium text-foreground text-sm transition-all duration-300 hover:animate-fill-transparency disabled:cursor-not-allowed disabled:opacity-50"
						>
							Add Route
						</button>
					</div>
				</div>

				{/* PROTECTED ROUTES LIST */}
				<div className="p-6">
					<h3 className="mb-4 font-semibold font-ui text-foreground text-lg">
						Protected Routes ({protectedRoutes.length})
					</h3>

					{protectedRoutes.length === 0 ? (
						<p className="py-8 text-center text-muted-foreground text-sm">
							No protected routes configured. Add routes above to get started.
						</p>
					) : (
						<div className="space-y-2">
							{protectedRoutes.map((route) => (
								<div
									key={route.path}
									className="flex items-center justify-between rounded-lg border border-transparent bg-fill-border p-3 hover:animate-fill-transparency"
								>
									<div className="flex-1">
										<code className="rounded bg-muted px-2 py-1 font-mono text-foreground text-sm">
											{route.path}
										</code>
										{route.description && (
											<p className="mt-1 text-muted-foreground text-xs">{route.description}</p>
										)}
									</div>

									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() => handleRouteToggle(route.path, !route.enabled)}
											className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${
												route.enabled
													? "bg-secondary shadow-[0_0_6px_1px_rgba(34,197,94,0.5)]"
													: "bg-muted"
											}`}
										>
											<span
												className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${
													route.enabled ? "translate-x-5" : "translate-x-1"
												}`}
											/>
										</button>

										<button
											type="button"
											onClick={() => handleRemoveRoute(route.path)}
											className="rounded p-1 text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
											title="Remove route"
										>
											🗑️
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* FOOTER */}
				<div className="rounded-b-xl border-border border-t bg-muted/30 p-6">
					<p className="text-center text-muted-foreground text-xs">
						<span className="font-brand">AgenitiX</span> protection uses advanced verification to
						ensure legitimate access. Protected routes will require visitors to complete a
						verification process before accessing the content.
					</p>
				</div>
			</div>
		</div>
	);
}
