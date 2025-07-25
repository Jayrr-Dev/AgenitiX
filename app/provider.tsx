"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<ConvexProvider client={convex}>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					{children}
				</AuthProvider>
			</QueryClientProvider>
		</ConvexProvider>
	);
}
