/**
 * DASHBOARD PAGE - User's main dashboard for managing flows
 *
 * • Displays user's flows with enhanced information
 * • New flow creation modal with comprehensive form
 * • Real-time flow management and navigation
 * • Secure user authentication and authorization
 * • Responsive design with modern UI components
 * • Full Convex database integration
 *
 * Keywords: dashboard, flows, modal, authentication, responsive, management, convex
 */

"use client";

// Force dynamic rendering to avoid prerendering issues
export const dynamic = "force-dynamic";

import { Loading } from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Flow } from "@/features/business-logic-modern/dashboard/types";
import { CreateFlowModal } from "@/features/business-logic-modern/dashboard/components/CreateFlowModal";
import { FlowActions } from "@/features/business-logic-modern/dashboard/components/FlowActions";
import { 
	Activity, 
	Bot, 
	Code, 
	Database, 
	Globe, 
	Mail, 
	MessageSquare, 
	Settings, 
	Users, 
	Zap,
	Plus 
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { DevAuthHelper } from "@/components/auth/DevAuthHelper";

// ICON MAPPING
const ICON_MAP = {
	zap: Zap,
	bot: Bot,
	activity: Activity,
	code: Code,
	database: Database,
	globe: Globe,
	mail: Mail,
	message: MessageSquare,
	settings: Settings,
	users: Users,
};

const DashboardContent = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const router = useRouter();
	const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

	// Convex hooks
	const flows = useQuery(
		api.flows.getUserFlows, 
		user?.id ? { user_id: user.id } : "skip"
	);
	const createFlow = useMutation(api.flows.createFlow);
	const deleteFlow = useMutation(api.flows.deleteFlow);

	// Loading state
	if (authLoading || flows === undefined) {
		return <Loading />;
	}

	// Authentication check
	if (!isAuthenticated || !user) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="text-center py-12">
					<h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
					<p className="text-muted-foreground mb-4">
						Please sign in to access your dashboard
					</p>
					<DevAuthHelper onAuthenticate={() => window.location.reload()} />
				</div>
			</div>
		);
	}

	// Error state
	if (flows === null) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="text-center py-12">
					<h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Flows</h2>
					<p className="text-muted-foreground mb-4">
						Unable to load your flows. Please try refreshing the page.
					</p>
					<Button onClick={() => window.location.reload()}>
						Refresh Page
					</Button>
				</div>
			</div>
		);
	}

	const handleFlowCreated = async (flowData: {
		name: string;
		description?: string;
		icon?: string;
		private: boolean;
	}) => {
		if (!user?.id) {
			throw new Error("User not authenticated");
		}

		try {
			const flowId = await createFlow({
				name: flowData.name,
				description: flowData.description,
				icon: flowData.icon,
				is_private: flowData.private,
				user_id: user.id,
			});

			// Navigate to the new flow
			router.push(`/matrix/${flowId}`);
		} catch (error) {
			console.error("Failed to create flow:", error);
			throw error; // Re-throw to let the modal handle the error
		}
	};

	const handleFlowDeleted = async (flowId: string) => {
		try {
			await deleteFlow({ flow_id: flowId as any });
		} catch (error) {
			console.error("Failed to delete flow:", error);
			throw error;
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const getIconComponent = (iconName: string) => {
		const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP] || Zap;
		return <IconComponent className="w-5 h-5" />;
	};

	// Convert Convex flows to dashboard format
	const dashboardFlows: Flow[] = flows.map(flow => ({
		id: flow._id,
		name: flow.name,
		description: flow.description,
		icon: flow.icon,
		private: flow.is_private,
		createdAt: flow.created_at,
		updatedAt: flow.updated_at,
		userId: flow.user_id,
	}));

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
				<Card 
					className="cursor-pointer hover:shadow-lg transition-shadow border-dashed border-2 border-muted-foreground/20 hover:border-primary/50"
					onClick={() => setIsModalOpen(true)}
				>
					<div className="flex flex-col items-center justify-center py-12">
						<Plus size={32} className="text-muted-foreground mb-2" />
						<CardTitle className="text-lg text-foreground">New Flow</CardTitle>
						<p className="text-sm text-muted-foreground mt-1 text-center">
							Create a new automation workflow
						</p>
					</div>
				</Card>

				{/* Existing flows */}
				{dashboardFlows.map((flow) => (
					<Card key={flow.id} className="relative hover:shadow-lg transition-shadow">
						{/* Private badge */}
						{flow.private && (
							<Badge variant="secondary" className="absolute top-3 right-3 text-xs">
								PRIVATE
							</Badge>
						)}

						<CardHeader className="flex items-center space-x-4">
							{/* Flow Icon */}
							<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
								{getIconComponent(flow.icon || "zap")}
							</div>
							<div className="flex-1 min-w-0">
								<CardTitle className="text-lg truncate">{flow.name}</CardTitle>
								{flow.description && (
									<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
										{flow.description}
									</p>
								)}
								<p className="text-xs text-muted-foreground mt-2">
									Updated: {formatDate(flow.updatedAt)}
								</p>
							</div>
						</CardHeader>

						<CardContent className="space-y-4">
							{/* Action Buttons */}
							<FlowActions 
								flow={flow} 
								onDelete={handleFlowDeleted}
							/>
							
							{/* Open Flow Button */}
							<Link href={`/matrix/${flow.id}`} passHref>
								<Button asChild variant="default" className="w-full">
									<div>Open Flow</div>
								</Button>
							</Link>
						</CardContent>
					</Card>
				))}

				{/* Empty state when no flows */}
				{dashboardFlows.length === 0 && (
					<div className="col-span-full text-center py-12">
						<Plus size={48} className="text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-medium text-foreground mb-2">
							No flows yet
						</h3>
						<p className="text-muted-foreground mb-4">
							Get started by creating your first automation workflow
						</p>
						<Button onClick={() => setIsModalOpen(true)}>
							Create Your First Flow
						</Button>
					</div>
				)}
			</div>

			{/* Create Flow Modal */}
			<CreateFlowModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onFlowCreated={handleFlowCreated}
			/>
		</div>
	);
};

export default function DashboardPage() {
	return <DashboardContent />;
}