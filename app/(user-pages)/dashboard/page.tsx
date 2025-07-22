// app/dashboard/page.tsx
"use client";

// Force dynamic rendering to avoid prerendering issues
export const dynamic = "force-dynamic";

import { Loading } from "@/components/Loading";
// Shadcn UI primitives
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Flow } from "@/features/business-logic-modern/dashboard/types";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
	const [flows, setFlows] = useState<Flow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch all flows on mount
	useEffect(() => {
		fetch("/api/flows")
			.then((res) => {
				if (!res.ok) throw new Error("Failed to load flows");
				return res.json() as Promise<Flow[]>;
			})
			.then(setFlows)
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, []);

	if (loading) return <Loading />;
	if (error) return <p className="p-8 text-red-600">Error: {error}</p>;

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-6">My Flows</h1>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{/* “New Flow” card */}
				<Link href="/matrix/new" passHref>
					<Card className="cursor-pointer hover:shadow-lg transition">
						<div className="flex flex-col items-center justify-center py-12">
							<IconPlus size={32} className="text-gray-400 mb-2" />
							<CardTitle className="text-lg">New Flow</CardTitle>
						</div>
					</Card>
				</Link>

				{/* Existing flows */}
				{flows.map((flow) => (
					<Card key={flow.id} className="relative">
						{/* Private badge */}
						{flow.private && (
							<Badge variant="destructive" className="absolute top-3 right-3 text-xs">
								PRIVATE
							</Badge>
						)}

						<CardHeader className="flex items-center space-x-4">
							{/* Avatar placeholder */}
							<div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center text-purple-600 font-bold uppercase">
								{flow.name.charAt(0)}
							</div>
							<CardTitle>{flow.name}</CardTitle>
						</CardHeader>

						<CardContent>
							<Link href={`/matrix/${flow.id}`} passHref>
								<Button asChild variant="default">
									<div>Open</div>
								</Button>
							</Link>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
