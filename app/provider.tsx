"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import type React from "react";
import { useState } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(/\/$/, "");

if (!convexUrl) {
	console.error("NEXT_PUBLIC_CONVEX_URL is not set. Please check your environment variables.");
}

const convex = new ConvexReactClient(convexUrl || "");

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<ConvexAuthNextjsProvider client={convex}>
				<AuthProvider>{children}</AuthProvider>
			</ConvexAuthNextjsProvider>
		</QueryClientProvider>
	);
}
