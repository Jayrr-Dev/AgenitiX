/**
 * DASHBOARD PAGE - Enhanced user dashboard for managing flows
 *
 * • Modern card-based layout with improved visual hierarchy
 * • One-click privacy toggle with visual feedback
 * • Enhanced flow cards with better information display
 * • Real-time flow management and navigation
 * • Secure user authentication and authorization
 * • Responsive design with modern UI components
 * • Full Convex database integration
 *
 * Keywords: dashboard, flows, modal, authentication, responsive, management, convex, privacy-toggle
 */

"use client";

// Force dynamic rendering to avoid prerendering issues
export const dynamic = "force-dynamic";
export const runtime = "edge";

import type React from "react";
import { Loading } from "@/components/Loading";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { DevAuthHelper } from "@/components/auth/DevAuthHelper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CreateFlowModal } from "@/features/business-logic-modern/dashboard/components/CreateFlowModal";
import { FlowActions } from "@/features/business-logic-modern/dashboard/components/FlowActions";
import type { Flow } from "@/features/business-logic-modern/dashboard/types";
import { useMutation, useQuery } from "convex/react";
import {
	Activity,
	Bot,
	Code,
	Database,
	ExternalLink,
	Eye,
	Globe,
	Lock,
	Mail,
	MessageSquare,
	Plus,
	Search,
	Settings,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

/**
 * Loading state component
 */
const DashboardLoading = () => <Loading />;

/**
 * Authentication required state component
 */
const DashboardAuthRequired = () => (
	<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div className="py-12 text-center">
			<h2 className="mb-2 font-bold text-2xl text-foreground">Authentication Required</h2>
			<p className="mb-4 text-muted-foreground">Please sign in to access your dashboard</p>
			<DevAuthHelper onAuthenticate={() => window.location.reload()} />
		</div>
	</div>
);

/**
 * Error state component
 */
const DashboardError = () => (
	<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div className="py-12 text-center">
			<h2 className="mb-2 font-bold text-2xl text-destructive">Error Loading Flows</h2>
			<p className="mb-4 text-muted-foreground">
				Unable to load your flows. Please try refreshing the page.
			</p>
			<Button onClick={() => window.location.reload()}>Refresh Page</Button>
		</div>
	</div>
);

/**
 * Flow event handlers hook
 */
const useFlowHandlers = (
	user: ReturnType<typeof useAuthContext>["user"],
	createFlow: ReturnType<typeof useMutation>,
	updateFlow: ReturnType<typeof useMutation>,
	router: ReturnType<typeof useRouter>
) => {
	const handleFlowCreated = async (flowData: {
		name: string;
		description?: string;
		icon?: string;
		private: boolean;
	}) => {
		if (!user?.id) {
			return;
		}

		try {
			const newFlow = await createFlow({
				name: flowData.name,
				description: flowData.description || "",
				icon: flowData.icon || "activity",
				is_private: flowData.private,
				flow_id: flowData.name.toLowerCase().replace(/\s+/g, "-") as Id<"flows">,
				user_id: user.id,
			});

			if (newFlow) {
				const flowId = newFlow;
				router.push(`/matrix/${flowId}`);
			}
		} catch (error) {
			console.error("Failed to create flow:", error);
		}
	};

	const handleFlowDeleted = (_flowId: string) => {
		// Flow deletion is handled by FlowActions component
	};

	const handleFlowUpdated = async (flowId: string, updates: Partial<Flow>) => {
		try {
			await updateFlow({
				flowId: flowId as Id<"flows">,
				...updates,
			});
		} catch (error) {
			console.error("Failed to update flow:", error);
		}
	};

	const handlePrivacyToggle = async (flowId: string, isPrivate: boolean) => {
		try {
			await updateFlow({
				flowId: flowId as Id<"flows">,
				is_private: isPrivate,
			});
		} catch (error) {
			console.error("Failed to toggle privacy:", error);
		}
	};

	return {
		handleFlowCreated,
		handleFlowDeleted,
		handleFlowUpdated,
		handlePrivacyToggle,
	};
};

/**
 * Utility functions for flow processing
 */
const useFlowUtils = () => {
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const getIconComponent = (iconName: string) => {
		const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP] || Zap;
		return <IconComponent className="h-5 w-5" />;
	};

	return { formatDate, getIconComponent };
};

/**
 * Flow data processing hook
 */
const useFlowData = (flows: any[] | undefined, searchQuery: string, showPrivateOnly: boolean) => {
	// Convert Convex flows to dashboard format
	const allFlows: Flow[] = (flows || []).map((flow) => ({
		id: flow._id,
		name: flow.name,
		description: flow.description,
		icon: flow.icon,
		private: flow.is_private,
		createdAt: flow.created_at,
		updatedAt: flow.updated_at,
		userId: flow.user_id,
	}));

	// Filter flows based on search and privacy filter
	const dashboardFlows = allFlows.filter((flow) => {
		const matchesSearch =
			searchQuery === "" ||
			flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			flow.description?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesPrivacy = !showPrivateOnly || flow.private;

		return matchesSearch && matchesPrivacy;
	});

	return { allFlows, dashboardFlows };
};

/**
 * Dashboard header with title and action buttons
 */
const DashboardHeader = ({
	onNewFlowClick,
	allFlows,
	searchQuery,
	setSearchQuery,
	showPrivateOnly,
	setShowPrivateOnly,
	dashboardFlows,
}: {
	onNewFlowClick: () => void;
	allFlows: Flow[];
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	showPrivateOnly: boolean;
	setShowPrivateOnly: (show: boolean) => void;
	dashboardFlows: Flow[];
}) => (
	<div className="mb-8">
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="mb-2 font-bold text-3xl text-foreground">My Flows</h1>
					<p className="text-muted-foreground">Create and manage your automation workflows</p>
				</div>
				<div className="flex items-center gap-3">
					<Link href="/explore">
						<Button variant="outline" className="gap-2">
							<Globe className="h-4 w-4" />
							Explore
						</Button>
					</Link>
					<Button onClick={onNewFlowClick} className="gap-2">
						<Plus className="h-4 w-4" />
						New Flow
					</Button>
				</div>
			</div>

			{/* Search and Filter Controls */}
			{allFlows.length > 0 && (
				<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
					<div className="flex max-w-md flex-1 items-center gap-4">
						<div className="relative flex-1">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
							<Input
								placeholder="Search flows..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Switch
								checked={showPrivateOnly}
								onCheckedChange={setShowPrivateOnly}
								className="data-[state=checked]:bg-orange-600"
							/>
							<span className="whitespace-nowrap text-muted-foreground text-sm">Private only</span>
						</div>
					</div>

					<div className="flex items-center gap-6 text-muted-foreground text-sm">
						<span>
							{dashboardFlows.length} of {allFlows.length} flows
						</span>
						<div className="flex items-center gap-4">
							<span className="flex items-center gap-1">
								<Eye className="h-3 w-3 text-green-600" />
								{allFlows.filter((f) => !f.private).length} public
							</span>
							<span className="flex items-center gap-1">
								<Lock className="h-3 w-3 text-orange-600" />
								{allFlows.filter((f) => f.private).length} private
							</span>
						</div>
					</div>
				</div>
			)}
		</div>
	</div>
);

/**
 * New Flow card component
 */
const NewFlowCard = ({ onClick }: { onClick: () => void }) => (
	<Card
		className="group aspect-square cursor-pointer border-2 border-muted-foreground/30 border-dashed bg-fill-border shadow-sm transition-all duration-300 hover:animate-fill-transparency hover:border-primary/60 hover:bg-primary/5 dark:shadow-white/5"
		style={{
			backgroundColor: "light-dark(#f5f5f5, var(--fill-border-color, #1a1a1a))",
		}}
		onClick={onClick}
	>
		<CardContent className="flex flex-col items-center justify-center py-16">
			<div className="mb-3 rounded-full bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
				<Plus className="h-6 w-6 text-primary" />
			</div>
			<h3 className="font-medium text-foreground">Create New Flow</h3>
			<p className="mt-1 text-center text-muted-foreground text-sm">
				Start building your automation
			</p>
		</CardContent>
	</Card>
);

/**
 * Flow grid component
 */
const FlowGrid = ({
	dashboardFlows,
	getIconComponent,
	formatDate,
	handleFlowDeleted,
	handleFlowUpdated,
	onNewFlowClick,
}: {
	dashboardFlows: Flow[];
	getIconComponent: (icon: string) => React.ReactNode;
	formatDate: (date: string) => string;
	handleFlowDeleted: (flowId: string) => void;
	handleFlowUpdated: (flowId: string, updates: Partial<Flow>) => void;
	onNewFlowClick: () => void;
}) => (
	<div
		className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
		style={{ gridAutoRows: "1fr" }}
	>
		<NewFlowCard onClick={onNewFlowClick} />
		{dashboardFlows.map((flow) => (
			<Card
				key={flow.id}
				className="group relative aspect-square cursor-pointer overflow-hidden border bg-card/50 shadow-sm backdrop-blur transition-all duration-300 hover:shadow-md hover:shadow-primary/10 dark:shadow-white/5"
			>
				<Link href={`/matrix/${flow.id}`} className="absolute inset-0 z-0">
					<span className="sr-only">Open {flow.name}</span>
				</Link>

				<CardHeader className="relative z-10 pb-3">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
								{getIconComponent(flow.icon || "activity")}
							</div>
							<div className="flex-1 overflow-hidden">
								<h3 className="truncate font-medium text-foreground" title={flow.name}>
									{flow.name}
								</h3>
								<p className="mt-1 truncate text-muted-foreground text-xs" title={flow.description}>
									{flow.description || "No description"}
								</p>
							</div>
						</div>

						<FlowActions
							flow={flow}
							onDelete={(flowId) => handleFlowDeleted(flowId)}
							onUpdate={(flowId, updates) => handleFlowUpdated(flowId, updates)}
						/>
					</div>
				</CardHeader>

				<CardContent className="relative z-10 pb-4 pt-0">
					<div className="flex items-center justify-between text-xs">
						<div className="flex items-center gap-1 text-muted-foreground">
							{flow.private ? (
								<>
									<Lock className="h-3 w-3 text-orange-600" />
									<span className="text-orange-600">Private</span>
								</>
							) : (
								<>
									<Eye className="h-3 w-3 text-green-600" />
									<span className="text-green-600">Public</span>
								</>
							)}
						</div>
						<span className="text-muted-foreground">{formatDate(flow.createdAt)}</span>
					</div>

					<div className="mt-3 flex items-center justify-between">
						<div className="flex items-center gap-1 text-muted-foreground text-xs">
							<Activity className="h-3 w-3" />
							<span>Updated {formatDate(flow.updatedAt)}</span>
						</div>
						<ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
					</div>
				</CardContent>
			</Card>
		))}
	</div>
);

/**
 * Empty state component
 */
const EmptyState = ({ onCreateFlow }: { onCreateFlow: () => void }) => (
	<div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-muted-foreground/30 border-dashed bg-muted/30 py-16 text-center">
		<div className="mb-4 rounded-full bg-primary/10 p-4">
			<MessageSquare className="h-8 w-8 text-primary" />
		</div>
		<h3 className="mb-2 font-medium text-lg text-foreground">No flows yet</h3>
		<p className="mb-6 max-w-sm text-muted-foreground">
			Create your first automation flow to get started with workflow management.
		</p>
		<Button onClick={onCreateFlow} className="gap-2">
			<Plus className="h-4 w-4" />
			Create Your First Flow
		</Button>
	</div>
);

const DashboardContent = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [showPrivateOnly, setShowPrivateOnly] = useState(false);
	const router = useRouter();
	const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

	// Convex hooks
	const flows = useQuery(api.flows.getUserFlows, user?.id ? { user_id: user.id } : "skip");
	const createFlow = useMutation(api.flows.createFlow);
	const updateFlow = useMutation(api.flows.updateFlow);

	// Custom hooks
	const { handleFlowCreated, handleFlowDeleted, handleFlowUpdated } =
		useFlowHandlers(user, createFlow, updateFlow, router);
	const { formatDate, getIconComponent } = useFlowUtils();
	const { allFlows, dashboardFlows } = useFlowData(flows || [], searchQuery, showPrivateOnly);

	// Handle potential SSR issues
	if (typeof window === "undefined") {
		return <DashboardLoading />;
	}

	// Loading state
	if (authLoading || flows === undefined) {
		return <DashboardLoading />;
	}

	// Authentication check
	if (!(isAuthenticated && user)) {
		return <DashboardAuthRequired />;
	}

	// Error state
	if (flows === null) {
		return <DashboardError />;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Enhanced Header */}
				<DashboardHeader
					onNewFlowClick={() => setIsModalOpen(true)}
					allFlows={allFlows}
					searchQuery={searchQuery}
					setSearchQuery={setSearchQuery}
					showPrivateOnly={showPrivateOnly}
					setShowPrivateOnly={setShowPrivateOnly}
					dashboardFlows={dashboardFlows}
				/>

				{/* Enhanced Grid Layout */}
				<FlowGrid
					dashboardFlows={dashboardFlows}
					getIconComponent={getIconComponent}
					formatDate={formatDate}
					handleFlowDeleted={handleFlowDeleted}
					handleFlowUpdated={handleFlowUpdated}
					onNewFlowClick={() => setIsModalOpen(true)}
				/>

				{/* Empty States */}
				{allFlows.length === 0 ? (
					// No flows at all
					<EmptyState onCreateFlow={() => setIsModalOpen(true)} />
				) : dashboardFlows.length === 0 ? (
					// No flows match current filter/search
					<div className="py-16 text-center">
						<div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
							<Search className="h-12 w-12 text-muted-foreground" />
						</div>
						<h3 className="mb-3 font-semibold text-foreground text-xl">No flows found</h3>
						<p className="mx-auto mb-6 max-w-md text-muted-foreground">
							{searchQuery
								? `No flows match "${searchQuery}". Try adjusting your search terms.`
								: "No private flows found. Try changing your filter settings."}
						</p>
						<div className="flex items-center justify-center gap-4">
							{searchQuery && (
								<Button variant="outline" onClick={() => setSearchQuery("")}>
									Clear Search
								</Button>
							)}
							{showPrivateOnly && (
								<Button variant="outline" onClick={() => setShowPrivateOnly(false)}>
									Show All Flows
								</Button>
							)}
						</div>
					</div>
				) : null}

				{/* Create Flow Modal */}
				<CreateFlowModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					onFlowCreated={handleFlowCreated}
				/>
			</div>
		</div>
	);
};

export default function DashboardPage() {
	return <DashboardContent />;
}
