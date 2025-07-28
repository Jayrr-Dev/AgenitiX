"use client";

import type { AnubisConfig, AnubisContextType, RouteProtectionConfig } from "@/types/anubis";
import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// ANUBIS CONTEXT
const AnubisContext = createContext<AnubisContextType | null>(null);

// ANUBIS PROVIDER PROPS
interface AnubisProviderProps {
	children: ReactNode;
	initialConfig?: Partial<AnubisConfig>;
}

// ANUBIS PROVIDER COMPONENT
export function AnubisProvider({ children, initialConfig }: AnubisProviderProps) {
	const [isEnabled, setIsEnabled] = useState(false);
	const [currentRoute, setCurrentRoute] = useState("/");
	const [protectedRoutes, setProtectedRoutes] = useState<Map<string, RouteProtectionConfig>>(
		new Map()
	);

	// INITIALIZE ANUBIS STATE
	useEffect(() => {
		// Check if we're in the browser
		if (typeof window === "undefined") return;

		// GET CURRENT ROUTE
		setCurrentRoute(window.location.pathname);

		// LOAD INITIAL CONFIGURATION
		if (initialConfig?.enabled) {
			setIsEnabled(initialConfig.enabled);
		}

		// LOAD PROTECTED ROUTES FROM LOCAL STORAGE
		try {
			const savedRoutes = localStorage.getItem("anubis-protected-routes");
			if (savedRoutes) {
				const routesArray = JSON.parse(savedRoutes) as RouteProtectionConfig[];
				const routesMap = new Map(routesArray.map((route) => [route.path, route]));
				setProtectedRoutes(routesMap);
			}
		} catch (error) {
			console.error("Failed to load saved routes:", error);
		}
	}, [initialConfig]);

	// Handle SSR - return early if not in browser
	if (typeof window === "undefined") {
		return <AnubisContext.Provider value={{
			isEnabled: false,
			isProtected: false,
			currentRoute: "/",
			toggleProtection: () => {},
			updateConfig: () => {},
			getRouteConfig: () => null,
		}}>{children}</AnubisContext.Provider>;
	}

	// SAVE ROUTES TO LOCAL STORAGE
	const saveRoutesToStorage = (routes: Map<string, RouteProtectionConfig>) => {
		if (typeof window === "undefined") return;

		try {
			const routesArray = Array.from(routes.values());
			localStorage.setItem("anubis-protected-routes", JSON.stringify(routesArray));
		} catch (error) {
			console.error("Failed to save routes:", error);
		}
	};

	// TOGGLE ROUTE PROTECTION
	const toggleProtection = (path: string, enabled: boolean) => {
		setProtectedRoutes((prev) => {
			const newRoutes = new Map(prev);
			const existing = newRoutes.get(path);

			if (existing) {
				existing.enabled = enabled;
			} else {
				newRoutes.set(path, {
					path,
					enabled,
					description: `Route protection for ${path}`,
				});
			}

			saveRoutesToStorage(newRoutes);
			return newRoutes;
		});
	};

	// UPDATE ANUBIS CONFIGURATION
	const updateConfig = (config: Partial<AnubisConfig>) => {
		if (config.enabled !== undefined) {
			setIsEnabled(config.enabled);
		}

		// SAVE TO LOCAL STORAGE
		if (typeof window !== "undefined") {
			try {
				const savedConfig = localStorage.getItem("anubis-config") || "{}";
				const currentConfig = JSON.parse(savedConfig);
				const updatedConfig = { ...currentConfig, ...config };
				localStorage.setItem("anubis-config", JSON.stringify(updatedConfig));
			} catch (error) {
				console.error("Failed to save config:", error);
			}
		}
	};

	// GET ROUTE CONFIGURATION
	const getRouteConfig = (path: string): RouteProtectionConfig | null => {
		return protectedRoutes.get(path) || null;
	};

	// CHECK IF CURRENT ROUTE IS PROTECTED
	const isProtected = protectedRoutes.get(currentRoute)?.enabled || false;

	// CONTEXT VALUE
	const contextValue: AnubisContextType = {
		isEnabled,
		isProtected,
		currentRoute,
		toggleProtection,
		updateConfig,
		getRouteConfig,
	};

	return <AnubisContext.Provider value={contextValue}>{children}</AnubisContext.Provider>;
}

// ANUBIS HOOK
export function useAnubis(): AnubisContextType {
	const context = useContext(AnubisContext);
	if (!context) {
		throw new Error("useAnubis must be used within an AnubisProvider");
	}
	return context;
}

// AGENITIX STATUS COMPONENT
export function AnubisStatus() {
	const { isEnabled, isProtected, currentRoute } = useAnubis();

	// CHECK IF UI IS ENABLED
	const [showUI, setShowUI] = useState(false);
	useEffect(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("anubis-ui-enabled");
			setShowUI(saved === "true");
		}
	}, []);

	if (!showUI || !isEnabled) return null;

	return (
		<div className="fixed bottom-4 right-4 bg-background border border-transparent bg-fill-border rounded-lg p-3 shadow-lg text-sm backdrop-blur-lg">
			<div className="flex items-center gap-2">
				<div
					className={`w-2 h-2 rounded-full ${isProtected ? "bg-secondary shadow-[0_0_4px_rgba(34,197,94,0.8)]" : "bg-muted"}`}
				></div>
				<span className="font-brand text-foreground">AgenitiX Protection</span>
			</div>
			<div className="text-muted-foreground mt-1">
				Route: <code className="text-xs bg-muted px-1 rounded">{currentRoute}</code>
			</div>
			<div className="text-muted-foreground">
				Status:{" "}
				<span className={isProtected ? "text-secondary" : "text-muted-foreground"}>
					{isProtected ? "🛡️ Protected" : "🔓 Unprotected"}
				</span>
			</div>
		</div>
	);
}
