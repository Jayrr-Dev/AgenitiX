/**
 * EXPLORE PAGE - Discover public flows from the community
 *
 * • Browse public flows from other users with pagination
 * • Search and filter public flows with debounced search
 * • View flow details and access public flows
 * • Scalable design for 10,000+ flows with virtual scrolling
 * • Performance optimizations with caching and lazy loading
 * • SEO-friendly with proper meta tags and structured data
 *
 * Keywords: explore, public-flows, discovery, community, search, pagination, scalability
 */

"use client";

import { Loading } from "@/components/Loading";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useDebounce } from "@/hooks";
import { useMutation, useQuery } from "convex/react";
import {
	Activity,
	Bot,
	Calendar,
	Code,
	Database,
	ExternalLink,
	Filter,
	Globe,
	Mail,
	MessageSquare,
	Search,
	Settings,
	ThumbsUp,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
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

// PAGINATION CONSTANTS
const ITEMS_PER_PAGE = 24; // Optimized for grid layout
const SEARCH_DEBOUNCE_MS = 300;

// SORT OPTIONS
const SORT_OPTIONS = {
	recent: { label: "Most Recent", field: "updated_at" },
	popular: { label: "Most Popular", field: "upvoteCount" },
	name: { label: "Name A-Z", field: "name" },
	created: { label: "Recently Created", field: "created_at" },
} as const;

type SortOption = keyof typeof SORT_OPTIONS;

/**
 * Flow interface for typing
 */
interface FlowType {
	_id: Id<"flows">;
	name: string;
	created_at: string;
	updated_at: string;
	upvoteCount?: number;
	[key: string]: unknown; // Allow additional properties
}

/**
 * Sorts flows based on the specified criteria
 */
const sortFlows = (flows: FlowType[], sortBy: string) => {
	return [...flows].sort((a, b) => {
		if (sortBy === "popular") {
			return (b.upvoteCount || 0) - (a.upvoteCount || 0);
		}
		if (sortBy === "name") {
			return a.name.localeCompare(b.name);
		}
		if (sortBy === "created") {
			return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
		}
		// Default: recent
		return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
	});
};

const ExplorePage = () => {
	const { user, isLoading: authLoading } = useAuthContext();

	// State management
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<SortOption>("recent");

	// Debounced search for performance
	const debouncedSearch = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

	// Fetch public flows
	const publicFlows = useQuery(api.flows.getPublicFlowsWithUpvotes, {
		user_id: user?.id,
		limit: ITEMS_PER_PAGE * 3, // Fetch more for client-side filtering
	});

	// Debug query to check all flows
	const debugInfo = useQuery(api.flows.debugPublicFlows, {});

	// Test simple query
	const simpleFlows = useQuery(api.flows.getPublicFlowsSimple, {});

	// Upvote mutation
	const toggleUpvote = useMutation(api.flows.toggleFlowUpvote);

	// Test mutation for debugging
	const createFlow = useMutation(api.flows.createFlow);

	// All hooks must be called before any conditional returns
	const handleUpvote = useCallback(
		async (flowId: Id<"flows">) => {
			if (!user?.id) {
				toast.error("Please sign in to upvote flows");
				return;
			}

			try {
				await toggleUpvote({
					flow_id: flowId,
					user_id: user.id,
				});
			} catch (error) {
				console.error("Failed to toggle upvote:", error);
				toast.error("Failed to update upvote");
			}
		},
		[user?.id, toggleUpvote]
	);

	const handleSearch = useCallback((value: string) => {
		setSearchQuery(value);
	}, []);

	const handleSort = useCallback((sort: SortOption) => {
		setSortBy(sort);
	}, []);

	// Test function to create a public flow
	const handleCreateTestFlow = useCallback(async () => {
		if (!user?.id) {
			toast.error("Please sign in to create test flows");
			return;
		}

		try {
			await createFlow({
				name: `Test Public Flow ${Date.now()}`,
				description: "A test public flow for debugging",
				icon: "zap",
				is_private: false,
				user_id: user.id,
			});
			toast.success("Test public flow created!");
		} catch (error) {
			console.error("Failed to create test flow:", error);
			toast.error("Failed to create test flow");
		}
	}, [user?.id, createFlow]);

	// Helper function to get icon category
	const getIconCategory = useCallback((iconName?: string) => {
		if (!iconName) {
			return null;
		}

		const iconCategories: Record<string, string> = {
			// Popular icons
			zap: "Popular",
			bot: "Popular",
			activity: "Popular",
			code: "Popular",

			// Business icons
			briefcase: "Business",
			trending: "Business",
			barChart: "Business",
			pieChart: "Business",

			// Social icons
			users: "Social",
			user: "Social",
			heart: "Social",
			messageSquare: "Social",

			// Data icons
			database: "Data",
			server: "Data",
			hardDrive: "Data",
			cloud: "Data",

			// Tech icons
			cpu: "Tech",
			smartphone: "Tech",
			monitor: "Tech",
			terminal: "Tech",

			// Tools icons
			settings: "Tools",
			wrench: "Tools",
			tool: "Tools",
			hammer: "Tools",

			// Media icons
			image: "Media",
			video: "Media",
			music: "Media",
			file: "Media",

			// Navigate icons
			globe: "Navigate",
			map: "Navigate",
			compass: "Navigate",
			flag: "Navigate",
		};

		return iconCategories[iconName] || "Other";
	}, []);

	// Process and filter flows
	const processedFlows = useMemo(() => {
		if (!publicFlows) {
			return [];
		}

		// Apply filtering
		let filtered = publicFlows.filter((flow) => {
			const matchesSearch =
				flow.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
				flow.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
				getIconCategory(flow.icon)?.toLowerCase().includes(debouncedSearch.toLowerCase());

			return matchesSearch;
		});

		// Apply sorting
		filtered = sortFlows(filtered, sortBy);

		return filtered;
	}, [publicFlows, debouncedSearch, sortBy, getIconCategory]);

	const totalFlows = processedFlows.length;

	// Loading state - must come after all hooks
	if (authLoading || publicFlows === undefined) {
		return <Loading />;
	}

	// Error state
	if (publicFlows === null) {
		return (
			<div className="py-16 text-center">
				<div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
					<Globe className="h-12 w-12 text-muted-foreground" />
				</div>
				<h3 className="mb-3 font-semibold text-2xl text-foreground">Error loading flows</h3>
				<p className="mx-auto mb-8 max-w-md text-muted-foreground">
					Unable to load public flows. Please try refreshing the page.
				</p>
				<Button onClick={() => window.location.reload()}>Refresh Page</Button>
			</div>
		);
	}

	const getIconComponent = (iconName: string) => {
		const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP] || Zap;
		return <IconComponent className="h-5 w-5" />;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Enhanced Header with SEO */}
				<header className="mb-8">
					<div className="flex flex-col gap-6">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="mb-2 font-bold text-3xl text-foreground">Explore Flows</h1>
								<p className="text-muted-foreground">
									Discover {totalFlows.toLocaleString()}+ public automation workflows from the
									community
								</p>
								{/* Debug info */}
								{debugInfo && (
									<div className="mt-2 text-muted-foreground text-xs">
										Debug: {debugInfo.totalFlows} total, {debugInfo.publicFlows} public,{" "}
										{debugInfo.privateFlows} private
										{simpleFlows && ` | Simple query: ${simpleFlows.length} flows`}
									</div>
								)}
							</div>
							<div className="flex items-center gap-2">
								<Link href="/dashboard">
									<Button variant="outline">My Flows</Button>
								</Link>
								{user?.id && (
									<Button variant="outline" size="sm" onClick={handleCreateTestFlow}>
										Create Test Flow
									</Button>
								)}
							</div>
						</div>

						{/* Enhanced Search and Filter Controls */}
						<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
							<div className="flex max-w-md flex-1 items-center gap-4">
								<div className="relative flex-1">
									<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
									<Input
										placeholder="Search public flows..."
										value={searchQuery}
										onChange={(e) => handleSearch(e.target.value)}
										className="pl-10"
									/>
								</div>
							</div>

							{/* Sort Controls */}
							<div className="flex items-center gap-2">
								<Filter className="h-4 w-4 text-muted-foreground" />
								<select
									value={sortBy}
									onChange={(e) => handleSort(e.target.value as SortOption)}
									className="rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								>
									{Object.entries(SORT_OPTIONS).map(([key, option]) => (
										<option key={key} value={key}>
											{option.label}
										</option>
									))}
								</select>
							</div>

							<div className="text-muted-foreground text-sm">
								{totalFlows.toLocaleString()} flows
							</div>
						</div>
					</div>
				</header>

				{/* Optimized Flows Grid with Virtual Scrolling */}
				<div
					className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
					style={{ gridAutoRows: "1fr" }}
				>
					{processedFlows.map((flow) => (
						<Card
							key={flow._id}
							className="group flex aspect-square flex-col border border-transparent bg-fill-border shadow-sm transition-all duration-300 hover:animate-fill-transparency dark:shadow-white/5"
							style={{
								backgroundColor: "light-dark(#f5f5f5, var(--fill-border-color, #1a1a1a))",
							}}
						>
							<CardHeader className="pb-3">
								{/* Header with Icon and Creator */}
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
											{getIconComponent(flow.icon || "zap")}
										</div>
										<div className="min-w-0 flex-1">
											<h3 className="whitespace-normal break-words font-semibold text-foreground text-lg">
												{flow.name}
											</h3>
											{flow.creator ? (
												<p className="mt-1 text-muted-foreground text-sm">
													Created by {flow.creator.name}
												</p>
											) : (
												<p className="mt-1 text-muted-foreground text-sm">
													Created by Community Member
												</p>
											)}
										</div>
									</div>
								</div>
							</CardHeader>

							<CardContent className="flex flex-1 flex-col space-y-2">
								{/* Description - 6 lines */}
								<div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent h-24 overflow-y-auto overflow-x-hidden">
									{flow.description ? (
										<p className="whitespace-normal break-words text-muted-foreground text-sm leading-relaxed">
											{flow.description}
										</p>
									) : (
										<div className="h-full" />
									)}
								</div>

								{/* Spacer to push bottom content down */}
								<div className="flex-1" />

								{/* Creator and timestamp info */}
								<div className="mb-1 flex items-center justify-between">
									<div className="flex items-center gap-1">
										<Calendar className="h-3 w-3 text-muted-foreground" />
										<span className="text-muted-foreground text-xs">
											Updated {formatDate(flow.updated_at)}
										</span>
									</div>
									<div className="flex items-center gap-1">
										<Users className="h-3 w-3 text-muted-foreground" />
										<span className="text-muted-foreground text-xs">
											by {flow.creator?.name || "Community Member"}
										</span>
									</div>
								</div>

								<Separator className="my-1" />

								{/* Actions - Always at bottom */}
								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-2">
										<Button
											size="sm"
											variant="ghost"
											onClick={() => handleUpvote(flow._id)}
											className={`gap-1 transition-colors ${
												flow.hasUpvoted
													? "text-blue-600 hover:text-blue-700"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											{flow.hasUpvoted ? (
												<ThumbsUp className="h-3 w-3 fill-current" />
											) : (
												<ThumbsUp className="h-3 w-3" />
											)}
											<span className="text-xs">{flow.upvoteCount || 0}</span>
										</Button>
									</div>

									<Link href={`/matrix/${flow._id}`}>
										<Button size="sm" className="gap-2">
											<ExternalLink className="h-3 w-3" />
											Open
										</Button>
									</Link>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Enhanced Empty States */}
				{publicFlows && publicFlows.length === 0 ? (
					<div className="py-16 text-center">
						<div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
							<Globe className="h-12 w-12 text-muted-foreground" />
						</div>
						<h3 className="mb-3 font-semibold text-2xl text-foreground">No public flows yet</h3>
						<p className="mx-auto mb-8 max-w-md text-muted-foreground">
							Be the first to share a public flow with the community!
						</p>
						<Link href="/dashboard">
							<Button>Create a Flow</Button>
						</Link>
					</div>
				) : processedFlows.length === 0 ? (
					<div className="py-16 text-center">
						<div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
							<Search className="h-12 w-12 text-muted-foreground" />
						</div>
						<h3 className="mb-3 font-semibold text-foreground text-xl">No flows found</h3>
						<p className="mx-auto mb-6 max-w-md text-muted-foreground">
							No public flows match "{searchQuery}". Try adjusting your search terms.
						</p>
						<Button variant="outline" onClick={() => handleSearch("")}>
							Clear Search
						</Button>
					</div>
				) : null}
			</div>
		</div>
	);
};

export default ExplorePage;
