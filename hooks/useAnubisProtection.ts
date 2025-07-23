"use client";

import { useAnubis } from "@/components/anubis/AnubisProvider";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";

// ANUBIS PROTECTION HOOK OPTIONS
interface UseAnubisProtectionOptions {
	enabled?: boolean;
	customDifficulty?: number;
	description?: string;
	autoProtect?: boolean;
}

// ANUBIS PROTECTION HOOK
export function useAnubisProtection(options: UseAnubisProtectionOptions = {}) {
	const { toggleProtection, getRouteConfig, isEnabled: globalEnabled } = useAnubis();
	const pathname = usePathname();

	const { enabled = true, customDifficulty, description, autoProtect = true } = options;

	// AUTO-PROTECT CURRENT ROUTE
	useEffect(() => {
		if (autoProtect && enabled && globalEnabled) {
			toggleProtection(pathname, true);
		}
	}, [pathname, enabled, globalEnabled, autoProtect, toggleProtection]);

	// MANUAL PROTECTION CONTROLS
	const protectCurrentRoute = () => {
		toggleProtection(pathname, true);
	};

	const unprotectCurrentRoute = () => {
		toggleProtection(pathname, false);
	};

	const toggleCurrentRoute = () => {
		const currentConfig = getRouteConfig(pathname);
		const isCurrentlyProtected = currentConfig?.enabled || false;
		toggleProtection(pathname, !isCurrentlyProtected);
	};

	// GET CURRENT PROTECTION STATUS
	const currentConfig = getRouteConfig(pathname);
	const isProtected = currentConfig?.enabled || false;

	return {
		isProtected,
		isGloballyEnabled: globalEnabled,
		currentRoute: pathname,
		protectCurrentRoute,
		unprotectCurrentRoute,
		toggleCurrentRoute,
		routeConfig: currentConfig,
	};
}

// COMPONENT WRAPPER FOR AUTOMATIC PROTECTION
interface ProtectedComponentProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
	options?: UseAnubisProtectionOptions;
}

export function ProtectedComponent({
	children,
	fallback = null,
	options = {},
}: ProtectedComponentProps) {
	const { isProtected, isGloballyEnabled } = useAnubisProtection(options);

	// SHOW FALLBACK IF NOT PROTECTED AND GLOBAL PROTECTION IS ENABLED
	if (isGloballyEnabled && !isProtected && fallback) {
		return React.createElement(React.Fragment, null, fallback);
	}

	return React.createElement(React.Fragment, null, children);
}

// PAGE PROTECTION HOC
export function withAnubisProtection<P extends Record<string, any>>(
	Component: React.ComponentType<P>,
	options: UseAnubisProtectionOptions = {}
) {
	return function ProtectedPage(props: P) {
		useAnubisProtection(options);
		return React.createElement(Component, props);
	};
}

// ROUTE PROTECTION UTILITIES
export const AnubisUtils = {
	// PROTECT MULTIPLE ROUTES AT ONCE
	protectRoutes: (routes: string[], toggleProtection: (path: string, enabled: boolean) => void) => {
		routes.forEach((route) => toggleProtection(route, true));
	},

	// UNPROTECT MULTIPLE ROUTES AT ONCE
	unprotectRoutes: (
		routes: string[],
		toggleProtection: (path: string, enabled: boolean) => void
	) => {
		routes.forEach((route) => toggleProtection(route, false));
	},

	// COMMON ROUTE PATTERNS
	patterns: {
		admin: ["/admin", "/admin/*", "/dashboard", "/dashboard/*"],
		api: ["/api/*"],
		auth: ["/login", "/register", "/profile", "/settings"],
		content: ["/blog/*", "/docs/*", "/help/*"],
		ecommerce: ["/checkout", "/cart", "/orders", "/payment"],
	},
};
