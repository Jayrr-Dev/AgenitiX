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

import { Loading } from "@/components/Loading";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { DevAuthHelper } from "@/components/auth/DevAuthHelper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
	Calendar,
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
import { toast } from "sonner";

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
	const [searchQuery, setSearchQuery] = useState("");
	const [showPrivateOnly, setShowPrivateOnly] = useState(false);
	const router = useRouter();
	const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

	// Convex hooks
	const flows = useQuery(api.flows.getUserFlows, user?.id ? { user_id: user.id } : "skip");
	const createFlow = useMutation(api.flows.createFlow);
	const updateFlow = useMutation(api.flows.updateFlow);

	// Handle potential SSR issues
	if (typeof window === "undefined") {
		return <Loading />;
	}

	// Loading state
	if (authLoading || flows === undefined) {
		return <Loading />;
	}

	// Authentication check
	if (!(isAuthenticated && user)) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="text-center py-12">
					<h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
					<p className="text-muted-foreground mb-4">Please sign in to access your dashboard</p>
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
					<Button onClick={() => window.location.reload()}>Refresh Page</Button>
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

	const handleFlowDeleted = async (_flowId: string) => {
		// Flow deletion is handled inside FlowActions. This callback can be used
		// for additional side-effects or optimistic UI updates if needed.
		// Currently, we rely on Convex reactivity to refresh the list, so no action
		// is required here.
	};

	const handleFlowUpdated = async (
		_flowId: string,
		_updates: { name?: string; description?: string; is_private?: boolean }
	) => {
		// The UI will automatically update via Convex reactivity
		// This callback is mainly for any additional UI feedback if needed
	};

	const handlePrivacyToggle = async (flowId: string, currentPrivacy: boolean) => {
		if (!user?.id) {
			toast.error("Authentication required");
			return;
		}

		try {
			await updateFlow({
				flow_id: flowId as Id<"flows">,
				user_id: user.id,
				is_private: !currentPrivacy,
			});

			toast.success(currentPrivacy ? "Flow is now public" : "Flow is now private");
		} catch (error) {
			console.error("Failed to update flow privacy:", error);
			toast.error(error instanceof Error ? error.message : "Failed to update privacy setting");
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
	const allFlows: Flow[] = flows.map((flow) => ({
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

	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Enhanced Header */}
				<div className="mb-8">
					<div className="flex flex-col gap-6">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-3xl font-bold text-foreground mb-2">My Flows</h1>
								<p className="text-muted-foreground">Create and manage your automation workflows</p>
							</div>
							<div className="flex items-center gap-3">
								<Link href="/explore">
									<Button variant="outline" className="gap-2">
										<Globe className="w-4 h-4" />
										Explore
									</Button>
								</Link>
								<Button onClick={() => setIsModalOpen(true)} className="gap-2">
									<Plus className="w-4 h-4" />
									New Flow
								</Button>
							</div>
						</div>

						{/* Search and Filter Controls */}
						{allFlows.length > 0 && (
							<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
								<div className="flex items-center gap-4 flex-1 max-w-md">
									<div className="relative flex-1">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
										<span className="text-sm text-muted-foreground whitespace-nowrap">
											Private only
										</span>
									</div>
								</div>

								<div className="flex items-center gap-6 text-sm text-muted-foreground">
									<span>
										{dashboardFlows.length} of {allFlows.length} flows
									</span>
									<div className="flex items-center gap-4">
										<span className="flex items-center gap-1">
											<Eye className="w-3 h-3 text-green-600" />
											{allFlows.filter((f) => !f.private).length} public
										</span>
										<span className="flex items-center gap-1">
											<Lock className="w-3 h-3 text-orange-600" />
											{allFlows.filter((f) => f.private).length} private
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Enhanced Grid Layout */}
				<div
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
					style={{ gridAutoRows: "1fr" }}
				>
					{/* Enhanced "New Flow" card */}
					<Card
						className="group cursor-pointer transition-all duration-300 border-dashed border-2 border-muted-foreground/30 hover:border-primary/60 hover:bg-primary/5 bg-fill-border hover:animate-fill-transparency aspect-square shadow-sm dark:shadow-white/5"
						style={{
							backgroundColor: "light-dark(#f5f5f5, var(--fill-border-color, #1a1a1a))",
						}}
						onClick={() => setIsModalOpen(true)}
					>
						<CardContent className="flex flex-col items-center justify-center py-16">
							<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
								<Plus className="w-8 h-8 text-primary" />
							</div>
							<h3 className="text-lg font-semibold text-foreground mb-2">Create New Flow</h3>
							<p className="text-sm text-muted-foreground text-center">
								Build a new automation workflow
							</p>
						</CardContent>
					</Card>

					{/* Enhanced Flow Cards */}
					{dashboardFlows.map((flow) => (
						<Card
							key={flow.id}
							className="group transition-all duration-300 border border-transparent bg-fill-border hover:animate-fill-transparency flex flex-col aspect-square shadow-sm dark:shadow-white/5"
							style={{
								backgroundColor: "light-dark(#f5f5f5, var(--fill-border-color, #1a1a1a))",
							}}
						>
							<CardHeader className="pb-3">
								{/* Header with Icon and Privacy Toggle */}
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div
											className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
												flow.private
													? "bg-orange-100 text-orange-600"
													: "bg-green-100 text-green-600"
											}`}
										>
											{getIconComponent(flow.icon || "zap")}
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold text-lg truncate text-foreground">
												{flow.name}
											</h3>
										</div>
									</div>

									{/* Privacy Toggle Switch */}
									<div className="flex flex-col items-center gap-0 mt-2">
										<Switch
											checked={!flow.private}
											onCheckedChange={() => handlePrivacyToggle(flow.id, flow.private)}
											className={`transition-all duration-200 ${
												flow.private
													? "data-[state=unchecked]:bg-orange-500"
													: "data-[state=checked]:bg-green-600"
											}`}
										/>
										<span className="text-xs text-muted-foreground">
											{flow.private ? "Private" : "Public"}
										</span>
									</div>
								</div>
							</CardHeader>

							<CardContent className="flex flex-col flex-1 space-y-2">
								{/* Description - 6 lines */}
								<div className="h-24 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
									{flow.description ? (
										<p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-normal">
											{flow.description}
										</p>
									) : (
										<div className="h-full" />
									)}
								</div>

								{/* Spacer to push bottom content down */}
								<div className="flex-1" />

								{/* Updated timestamp - Above actions, left aligned, reduced spacing */}
								<div className="flex items-center gap-1 mb-1">
									<Calendar className="w-3 h-3 text-muted-foreground" />
									<span className="text-xs text-muted-foreground">
										Updated {formatDate(flow.updatedAt)}
									</span>
								</div>

								<Separator className="my-1" />

								{/* Actions - Always at bottom */}
								<div className="flex items-center justify-between gap-2">
									<FlowActions
										flow={flow}
										onDelete={handleFlowDeleted}
										onUpdate={handleFlowUpdated}
									/>

									<Link href={`/matrix/${flow.id}`}>
										<Button size="sm" className="gap-2">
											<ExternalLink className="w-3 h-3" />
											Open
										</Button>
									</Link>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Empty States */}
				{allFlows.length === 0 ? (
					// No flows at all
					<div className="text-center py-16">
						<div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
							<Zap className="w-12 h-12 text-primary" />
						</div>
						<h3 className="text-2xl font-semibold text-foreground mb-3">Ready to automate?</h3>
						<p className="text-muted-foreground mb-8 max-w-md mx-auto">
							Create your first workflow to start automating tasks and streamlining your processes.
						</p>
						<Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2">
							<Plus className="w-5 h-5" />
							Create Your First Flow
						</Button>
					</div>
				) : dashboardFlows.length === 0 ? (
					// No flows match current filter/search
					<div className="text-center py-16">
						<div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
							<Search className="w-12 h-12 text-muted-foreground" />
						</div>
						<h3 className="text-xl font-semibold text-foreground mb-3">No flows found</h3>
						<p className="text-muted-foreground mb-6 max-w-md mx-auto">
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
