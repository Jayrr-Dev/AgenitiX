"use client";

// Force dynamic rendering to avoid prerendering issues
export const dynamic = "force-dynamic";


import { Loading } from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Flow } from "@/features/business-logic-modern/dashboard/types";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const DashboardContent = () => {
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
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-6">
					<h2 className="text-2xl font-bold text-foreground">My Flows</h2>
					<p className="text-muted-foreground mt-1">
						Create and manage your automation workflows
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* "New Flow" card */}
					<Link href="/matrix/new" passHref>
						<Card className="cursor-pointer hover:shadow-lg transition-shadow">
							<div className="flex flex-col items-center justify-center py-12">
								<IconPlus size={32} className="text-muted-foreground mb-2" />
								<CardTitle className="text-lg text-foreground">New Flow</CardTitle>
								<p className="text-sm text-muted-foreground mt-1">
									Create a new automation workflow
								</p>
							</div>
						</Card>
					</Link>

					{/* Existing flows */}
					{flows.map((flow) => (
						<Card key={flow.id} className="relative hover:shadow-lg transition-shadow">
							{/* Private badge */}
							{flow.private && (
								<Badge variant="destructive" className="absolute top-3 right-3 text-xs">
									PRIVATE
								</Badge>
							)}

							<CardHeader className="flex items-center space-x-4">
								{/* Avatar placeholder */}
								<div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold uppercase">
									{flow.name.charAt(0)}
								</div>
								<div>
									<CardTitle className="text-lg">{flow.name}</CardTitle>
									<p className="text-sm text-muted-foreground">
										Last modified: {new Date().toLocaleDateString()}
									</p>
								</div>
							</CardHeader>

							<CardContent>
								<Link href={`/matrix/${flow.id}`} passHref>
									<Button asChild variant="default" className="w-full">
										<div>Open Flow</div>
									</Button>
								</Link>
							</CardContent>
						</Card>
					))}

					{/* Empty state when no flows */}
					{flows.length === 0 && (
						<div className="col-span-full text-center py-12">
							<IconPlus size={48} className="text-muted-foreground mx-auto mb-4" />
							<h3 className="text-lg font-medium text-foreground mb-2">
								No flows yet
							</h3>
							<p className="text-muted-foreground mb-4">
								Get started by creating your first automation workflow
							</p>
							<Link href="/matrix/new">
								<Button>Create Your First Flow</Button>
							</Link>
						</div>
					)}
				</div>
			</div>
	);
};

export default function DashboardPage() {
	return <DashboardContent />;
}